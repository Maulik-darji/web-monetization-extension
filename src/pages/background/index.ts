// eslint-disable-next-line import/default
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script'

import { addTabChangeListener } from '@/lib/listeners'
import { sendTabsMessage } from '@/lib/messageUtils'
import { addMessageListener, BrowserAPI } from '@/src/lib'

const icon34 = BrowserAPI.runtime.getURL('icon-34.png')
const icon128 = BrowserAPI.runtime.getURL('icon-128.png')
const iconActive34 = BrowserAPI.runtime.getURL('icon-active-34.png')
const iconActive128 = BrowserAPI.runtime.getURL('icon-active-128.png')

const updateIcon = (active: boolean) => {
  const iconData = {
    '34': active ? iconActive34 : icon34,
    '128': active ? iconActive128 : icon128,
  }

  if (BrowserAPI.action) {
    BrowserAPI.action.setIcon({ path: iconData })
  } else {
    BrowserAPI.browserAction.setIcon({ path: iconData })
  }
}

addMessageListener(({ type, content }) => {
  if (type === 'MONETIZATION_START') {
    updateIcon(content)
  }
})

const handleTabChange = (activeInfo: chrome.tabs.TabActiveInfo) => {
  const tabId = activeInfo.tabId

  BrowserAPI.tabs.get(tabId, tab => {
    if (tab && tab.status === 'complete') {
      sendTabsMessage({ action: 'GET_MONETIZATION' }, tabId, response => {
        updateIcon(response)
      })
    }
  })
}

addTabChangeListener(handleTabChange)

reloadOnUpdate('@/pages/background')
reloadOnUpdate('@/pages/content/style.scss')
