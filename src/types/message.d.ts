declare type EXTMessageType =
  | 'SET_MONETIZATION_READY'
  | 'IS_MONETIZATION_READY'
  | 'SET_INCOMING_POINTER'
  | 'GET_SENDING_PAYMENT_POINTER'
  | 'START_PAYMENT'
  | 'RUN_PAYMENT'
  | 'START_MONETIZATION'
  | 'START_PAYMENTS'
  | 'STOP_PAYMENTS'

declare type EXTMessage<T = any> = {
  type: EXTMessageType
  data?: T
}
