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
  { id: 'plan_1m', duration: 1, price: 10, label: '1 Minuto' },
  { id: 'plan_2m', duration: 2, price: 15, label: '2 Minutos' },
  { id: 'plan_3m', duration: 3, price: 20, label: '3 Minutos' },
]

export const DEFAULT_MIKROTIK_LOGIN_URL = 'http://internet.online/login'