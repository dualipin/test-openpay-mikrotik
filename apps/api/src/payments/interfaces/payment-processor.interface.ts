export interface CreatePaymentDto {
  amount: number
  currency: string
  customerId: string
  description?: string
}

export type PaymentProvider = 'openpay' | 'stripe' | 'mercado_pago'

export interface PaymentResult {
  success: boolean
  transactionId?: string
  provider: PaymentProvider
  rawResponse: any
}

export interface IPaymentProcessor {
  createCharge(data: CreatePaymentDto): Promise<PaymentResult>
  handleWebhook(payload: any): Promise<void>
}
