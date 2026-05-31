export interface InternetPlan {
  id: string
  duration: number
  price: number
  label: string
}

export interface CustomerData {
  name: string
  email: string
  phone: string
}

export interface CardData {
  holderName: string
  cardNumber: string
  expirationMonth: string
  expirationYear: string
  cvv2: string
}

export interface Credentials {
  username: string
  password: string
  expiresAt: string
}

export type PaymentMethod = 'card' | 'cash' | 'spei'

export type MobilePanel = 'flow' | 'summary'

export type CheckoutMessage = {
  type: 'success' | 'error'
  text: string
} | null

export const INTERNET_PLANS: InternetPlan[] = [
  { id: 'plan_5m', duration: 5, price: 10, label: '5 Minutos' },
  { id: 'plan_10m', duration: 10, price: 15, label: '10 Minutos' },
  { id: 'plan_15m', duration: 15, price: 20, label: '15 Minutos' },
]

export const DEFAULT_MIKROTIK_LOGIN_URL = 'http://internet.online/login'