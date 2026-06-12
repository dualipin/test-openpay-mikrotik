import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  DEFAULT_MIKROTIK_LOGIN_URL,
  type CardData,
  type CheckoutMessage,
  type Credentials,
  type CustomerData,
  type InternetPlan,
  type MobilePanel,
  type PaymentMethod,
} from '../components/checkout/types'

const STEPS = 3

export interface CheckoutController {
  currentStep: number
  mobilePanel: MobilePanel
  isLoading: boolean
  isOpenPayReady: boolean
  deviceSessionId: string
  message: CheckoutMessage
  selectedPlan: InternetPlan | null
  customer: CustomerData
  card: CardData
  paymentMethod: PaymentMethod
  userCreds: Credentials | null
  autoLoginCountdown: number | null
  subtotal: number
  total: number
  emailValid: boolean
  phoneValid: boolean
  customerValid: boolean
  cardValid: boolean
  cardBrand: string
  canSubmitPayment: boolean
  formatMoney: (amount: number) => string
  setStep: (step: number) => void
  setMobilePanel: (panel: MobilePanel) => void
  setMessage: (message: CheckoutMessage) => void
  selectPlan: (plan: InternetPlan) => void
  updateCustomer: (fields: Partial<CustomerData>) => void
  updateCard: (fields: Partial<CardData>) => void
  choosePaymentMethod: (method: PaymentMethod) => void
  nextStep: () => void
  prevStep: () => void
  continueFromPlan: () => void
  continueFromCustomer: (event: FormEvent<HTMLFormElement>) => void
  handlePayment: (event: FormEvent<HTMLFormElement>) => void
  startAnotherPurchase: () => void
}

export function useCheckout(): CheckoutController {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('flow')
  const [deviceSessionId, setDeviceSessionId] = useState<string>('')
  const [isOpenPayReady, setIsOpenPayReady] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<CheckoutMessage>(null)
  const [customer, setCustomer] = useState<CustomerData>({ name: '', email: '', phone: '' })
  const [card, setCard] = useState<CardData>({ holderName: '', cardNumber: '', expirationMonth: '', expirationYear: '', cvv2: '' })
  const [selectedPlan, setSelectedPlan] = useState<InternetPlan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [userCreds, setUserCreds] = useState<Credentials | null>(null)
  const [autoLoginCountdown, setAutoLoginCountdown] = useState<number | null>(null)
  const autoLoginTimeoutRef = useRef<number | null>(null)
  const autoLoginIntervalRef = useRef<number | null>(null)

  const subtotal = selectedPlan?.price ?? 0
  const total = useMemo(() => subtotal, [subtotal])

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())
  const phoneDigits = customer.phone.replace(/\D/g, '')
  const phoneValid = phoneDigits.length >= 10
  const customerValid = Boolean(customer.name.trim() && emailValid && phoneValid)

  const cardDigits = card.cardNumber.replace(/\D/g, '')
  const monthNumber = Number(card.expirationMonth)
  const cardValid =
    card.holderName.trim().length > 3 &&
    cardDigits.length >= 15 &&
    monthNumber >= 1 &&
    monthNumber <= 12 &&
    card.expirationYear.trim().length === 2 &&
    card.cvv2.trim().length >= 3

  const cardBrand = useMemo(() => {
    if (/^4/.test(cardDigits)) return 'Visa'
    if (/^5[1-5]/.test(cardDigits) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(cardDigits)) return 'Mastercard'
    if (/^3[47]/.test(cardDigits)) return 'American Express'
    return 'Tarjeta'
  }, [cardDigits])

  const canSubmitPayment =
    currentStep === 3 &&
    selectedPlan !== null &&
    customerValid &&
    paymentMethod === 'card' &&
    cardValid &&
    isOpenPayReady &&
    !isLoading

  useEffect(() => {
    let cancelled = false

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
        if (existing) {
          if (existing.dataset.loaded === 'true') {
            resolve()
            return
          }

          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error(`Error loading ${src}`)), { once: true })
          return
        }

        const script = document.createElement('script')
        script.src = src
        script.async = true
        script.dataset.loaded = 'false'
        script.onload = () => {
          script.dataset.loaded = 'true'
          resolve()
        }
        script.onerror = () => reject(new Error(`Error loading ${src}`))
        document.body.appendChild(script)
      })

    const init = async () => {
      try {
        await loadScript('https://js.openpay.mx/openpay.v1.min.js')
        await loadScript('https://js.openpay.mx/openpay-data.v1.min.js')

        if (cancelled) return

        if (!window.OpenPay) {
          setIsOpenPayReady(false)
          setMessage({ type: 'error', text: 'OpenPay no está disponible en este momento' })
          return
        }

        const merchantId = import.meta.env.VITE_OPENPAY_MERCHANT_ID
        const publicKey = import.meta.env.VITE_OPENPAY_PUBLIC_KEY
        const isProduction = import.meta.env.VITE_OPENPAY_PRODUCTION === 'true'

        window.OpenPay.setId(merchantId)
        window.OpenPay.setApiKey(publicKey)
        window.OpenPay.setSandboxMode(!isProduction)

        const sessionId = window.OpenPay.deviceData.setup('payment-form', 'deviceIdHiddenFieldName')
        setDeviceSessionId(sessionId)
        setIsOpenPayReady(true)
      } catch (err) {
        console.error('OpenPay init error:', err)
        setIsOpenPayReady(false)
        setMessage({ type: 'error', text: 'No se pudo cargar OpenPay. Intenta recargar.' })
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (autoLoginTimeoutRef.current !== null) {
        window.clearTimeout(autoLoginTimeoutRef.current)
      }
      if (autoLoginIntervalRef.current !== null) {
        window.clearInterval(autoLoginIntervalRef.current)
      }
    }
  }, [])

  function formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  function clearAutoLoginTimers() {
    if (autoLoginTimeoutRef.current !== null) {
      window.clearTimeout(autoLoginTimeoutRef.current)
      autoLoginTimeoutRef.current = null
    }
    if (autoLoginIntervalRef.current !== null) {
      window.clearInterval(autoLoginIntervalRef.current)
      autoLoginIntervalRef.current = null
    }
  }

  function autoLoginMikrotik(username: string, password: string) {
    const loginUrl = import.meta.env.VITE_MIKROTIK_LOGIN_URL || DEFAULT_MIKROTIK_LOGIN_URL
    const hotspotUrl = new URL(loginUrl)

    hotspotUrl.searchParams.append('username', username)
    hotspotUrl.searchParams.append('password', password)
    hotspotUrl.searchParams.append('dst', 'https://www.google.com')

    window.location.href = hotspotUrl.toString()
  }

  function nextStep() {
    setCurrentStep((previous) => Math.min(previous + 1, STEPS))
  }

  function prevStep() {
    setCurrentStep((previous) => Math.max(previous - 1, 1))
  }

  function selectPlan(plan: InternetPlan) {
    setSelectedPlan(plan)
    setMessage(null)
  }

  function updateCustomer(fields: Partial<CustomerData>) {
    setCustomer((previous) => ({ ...previous, ...fields }))
  }

  function updateCard(fields: Partial<CardData>) {
    setCard((previous) => ({ ...previous, ...fields }))
  }

  function choosePaymentMethod(method: PaymentMethod) {
    setPaymentMethod(method)
  }

  function continueFromPlan() {
    if (!selectedPlan) {
      setMessage({ type: 'error', text: 'Selecciona un plan para continuar.' })
      return
    }

    setMessage(null)
    setCurrentStep(2)
  }

  function continueFromCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!customerValid) {
      setMessage({ type: 'error', text: 'Completa tus datos correctamente para continuar.' })
      return
    }

    setMessage(null)
    setCurrentStep(3)
  }

  async function sendPaymentToBackend(tokenId: string) {
    try {
      if (!selectedPlan) {
        setMessage({ type: 'error', text: 'Por favor selecciona un plan' })
        return
      }

      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await fetch(`${backendUrl}/internet-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPlan.price,
          plan_id: selectedPlan.id,
          duration: selectedPlan.duration,
          source_id: tokenId,
          device_session_id: deviceSessionId,
          currency: 'MXN',
          order_id: `INTERNET-${Date.now()}`,
          customer: {
            name: customer.name.split(' ')[0],
            last_name: customer.name.split(' ').slice(1).join(' ') || customer.name,
            email: customer.email,
            phone_number: customer.phone,
          },
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: '¡Pago exitoso! Se han generado tus credenciales' })
        setUserCreds(data.credentials as Credentials)
        setCurrentStep(4)

        const credentials = data.credentials as Credentials
        clearAutoLoginTimers()

        const countdownSeconds = 3
        let remainingSeconds = countdownSeconds
        setAutoLoginCountdown(remainingSeconds)

        autoLoginIntervalRef.current = window.setInterval(() => {
          remainingSeconds -= 1
          if (remainingSeconds <= 0) {
            setAutoLoginCountdown(null)
            if (autoLoginIntervalRef.current !== null) {
              window.clearInterval(autoLoginIntervalRef.current)
              autoLoginIntervalRef.current = null
            }
            return
          }

          setAutoLoginCountdown(remainingSeconds)
        }, 1000)

        autoLoginTimeoutRef.current = window.setTimeout(() => {
          autoLoginMikrotik(credentials.username, credentials.password)
        }, countdownSeconds * 1000)

        const form = document.getElementById('payment-form') as HTMLFormElement | null
        form?.reset()

        setCustomer({ name: '', email: '', phone: '' })
        setSelectedPlan(null)
        setCard({ holderName: '', cardNumber: '', expirationMonth: '', expirationYear: '', cvv2: '' })
        setPaymentMethod('card')
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Error al procesar el pago' })
      }
    } catch (err) {
      console.error('Payment error:', err)
      setMessage({ type: 'error', text: 'Error de conexión con el servidor' })
    } finally {
      setIsLoading(false)
    }
  }

  function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!customerValid) {
      setMessage({ type: 'error', text: 'Por favor completa todos los campos' })
      return
    }

    if (!selectedPlan) {
      setMessage({ type: 'error', text: 'Por favor selecciona un plan' })
      return
    }

    if (paymentMethod !== 'card') {
      setMessage({ type: 'error', text: 'Por ahora solo tarjeta está disponible en línea.' })
      return
    }

    if (!cardValid) {
      setMessage({ type: 'error', text: 'Completa correctamente los datos de la tarjeta.' })
      return
    }

    if (!isOpenPayReady || !window.OpenPay) {
      setMessage({ type: 'error', text: 'OpenPay no está listo. Intenta recargar.' })
      return
    }

    if (!deviceSessionId) {
      setMessage({ type: 'error', text: 'No se pudo generar el identificador del dispositivo' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    window.OpenPay.token.create(
      {
        holder_name: card.holderName,
        card_number: cardDigits,
        expiration_month: card.expirationMonth,
        expiration_year: card.expirationYear,
        cvv2: card.cvv2,
      },
      (response: { data?: { id?: string; error_code?: string } }) => {
        if (response.data?.id) {
          void sendPaymentToBackend(response.data.id)
          return
        }

        setIsLoading(false)
        setMessage({ type: 'error', text: response.data?.error_code ? `Error: ${response.data.error_code}` : 'Error al crear el token' })
      },
      (error: { description?: string; data?: { description?: string } }) => {
        setIsLoading(false)
        setMessage({ type: 'error', text: error?.description || error?.data?.description || 'Error al crear el token' })
      }
    )
  }

  function startAnotherPurchase() {
    clearAutoLoginTimers()
    setAutoLoginCountdown(null)
    setUserCreds(null)
    setCurrentStep(1)
    setMobilePanel('flow')
  }

  return {
    currentStep,
    mobilePanel,
    isLoading,
    isOpenPayReady,
    deviceSessionId,
    message,
    selectedPlan,
    customer,
    card,
    paymentMethod,
    userCreds,
    autoLoginCountdown,
    subtotal,
    total,
    emailValid,
    phoneValid,
    customerValid,
    cardValid,
    cardBrand,
    canSubmitPayment,
    formatMoney,
    setStep: setCurrentStep,
    setMobilePanel,
    setMessage,
    selectPlan,
    updateCustomer,
    updateCard,
    choosePaymentMethod,
    nextStep,
    prevStep,
    continueFromPlan,
    continueFromCustomer,
    handlePayment,
    startAnotherPurchase,
  }
}