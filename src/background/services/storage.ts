import type { PopupStore, Storage, StorageKey } from '@/shared/types'
import { type Browser } from 'webextension-polyfill'
import { getCurrentActiveTab } from '../utils'
import { EventsService } from './events'
import { ALLOWED_PROTOCOLS } from '@/shared/defines'

const defaultStorage = {
  connected: false,
  enabled: true,
  hasHostPermissions: true,
  exceptionList: {},
  walletAddress: null,
  amount: null,
  token: null,
  grant: null,
  rateOfPay: null,
  minRateOfPay: null,
  maxRateOfPay: null
} satisfies Omit<Storage, 'publicKey' | 'privateKey' | 'keyId'>

export class StorageService {
  constructor(
    private browser: Browser,
    private events: EventsService
  ) {}

  async get<TKey extends StorageKey>(
    keys?: TKey[]
  ): Promise<{ [Key in TKey[][number]]: Storage[Key] }> {
    const data = await this.browser.storage.local.get(keys)
    return data as { [Key in TKey[][number]]: Storage[Key] }
  }

  async set<TKey extends StorageKey>(data: {
    [K in TKey]: Storage[TKey]
  }): Promise<void> {
    await this.browser.storage.local.set(data)
  }

  async clear(): Promise<void> {
    await this.set(defaultStorage)
  }

  async populate(): Promise<void> {
    const data = await this.get(Object.keys(defaultStorage) as StorageKey[])

    if (Object.keys(data).length === 0) {
      await this.set(defaultStorage)
    }
  }

  // TODO: Exception list (post-v1) - return data for the current website
  async getPopupData(): Promise<PopupStore> {
    let url: string | undefined
    const data = await this.get([
      'enabled',
      'connected',
      'hasHostPermissions',
      'amount',
      'rateOfPay',
      'minRateOfPay',
      'maxRateOfPay',
      'walletAddress',
      'publicKey'
    ])
    const tab = await getCurrentActiveTab(this.browser)

    if (tab && tab.url) {
      try {
        const tabUrl = new URL(tab.url)
        if (ALLOWED_PROTOCOLS.includes(tabUrl.protocol)) {
          // Do not include search params
          url = `${tabUrl.origin}${tabUrl.pathname}`
        }
      } catch (_) {
        // noop
      }
    }

    return { ...data, url }
  }

  async getWMState(): Promise<boolean> {
    const { enabled } = await this.get(['enabled'])

    return enabled
  }

  async keyPairExists(): Promise<boolean> {
    const keys = await this.get(['privateKey', 'publicKey', 'keyId'])
    if (
      keys.privateKey &&
      typeof keys.privateKey === 'string' &&
      keys.publicKey &&
      typeof keys.publicKey === 'string' &&
      keys.keyId &&
      typeof keys.keyId === 'string'
    ) {
      return true
    }

    return false
  }

  async setHostPermissionStatus(status: boolean): Promise<void> {
    const { hasHostPermissions } = await this.get(['hasHostPermissions'])
    if (hasHostPermissions !== status) {
      await this.set({ hasHostPermissions: status })
      this.events.emit('storage.host_permissions_update', { status })
    }
  }

  async updateRate(rate: string): Promise<void> {
    await this.set({ rateOfPay: rate })
    this.events.emit('storage.rate_of_pay_update', { rate })
  }
}
