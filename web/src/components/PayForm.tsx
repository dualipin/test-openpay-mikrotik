import React, { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { IMaskInput } from "react-imask"

interface InternetPlan {
  id: string
  duration: number
  price: number
  label: string
}

interface CustomerData {
  name: string
  email: string
  phone: string
}

interface CardData {
  holderName: string
  cardNumber: string
  expirationMonth: string
  expirationYear: string
  cvv2: string
}

interface Credentials {
  username: string
  password: string
  expiresAt: string
}

type PaymentMethod = 'card' | 'cash' | 'spei'

const INTERNET_PLANS: InternetPlan[] = [
  { id: 'plan_5m', duration: 5, price: 10, label: '5 Minutos' },
  { id: 'plan_10m', duration: 10, price: 15, label: '10 Minutos' },
  { id: 'plan_15m', duration: 15, price: 20, label: '15 Minutos' }
]

const DEFAULT_MIKROTIK_LOGIN_URL = 'http://internet.online/login'

export default function PayForm(): React.ReactElement {
  const [step, setStep] = useState<number>(1)
  const [deviceSessionId, setDeviceSessionId] = useState<string>('')
  const [isOpenPayReady, setIsOpenPayReady] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [customer, setCustomer] = useState<CustomerData>({ name: '', email: '', phone: '' })
  const [card, setCard] = useState<CardData>({ holderName: '', cardNumber: '', expirationMonth: '', expirationYear: '', cvv2: '' })
  const [selectedPlan, setSelectedPlan] = useState<InternetPlan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [mobilePanel, setMobilePanel] = useState<'flow' | 'summary'>('flow')
  const [userCreds, setUserCreds] = useState<Credentials | null>(null)
  const [autoLoginCountdown, setAutoLoginCountdown] = useState<number | null>(null)
  const autoLoginTimeoutRef = useRef<number | null>(null)
  const autoLoginIntervalRef = useRef<number | null>(null)

  const subtotal = selectedPlan?.price ?? 0
  const tax = useMemo(() => Number((subtotal * 0.16).toFixed(2)), [subtotal])
  const total = useMemo(() => Number((subtotal + tax).toFixed(2)), [subtotal, tax])

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

  const canSubmitPayment =
    step === 3 &&
    selectedPlan !== null &&
    customerValid &&
    paymentMethod === 'card' &&
    cardValid &&
    isOpenPayReady &&
    !isLoading

  const cardBrand = useMemo(() => {
    if (/^4/.test(cardDigits)) return 'Visa'
    if (/^5[1-5]/.test(cardDigits) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(cardDigits)) return 'Mastercard'
    if (/^3[47]/.test(cardDigits)) return 'American Express'
    return 'Tarjeta'
  }, [cardDigits])

  useEffect(() => {
    let cancelled = false

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
        if (existing) {
          if ((existing as any).dataset?.loaded === 'true') {
            resolve()
            return
          }

          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error(`Error loading ${src}`)), { once: true })
          return
        }

        const s = document.createElement('script')
        s.src = src
        s.async = true
        s.dataset.loaded = 'false'
        s.onload = () => {
          s.dataset.loaded = 'true'
          resolve()
        }
        s.onerror = () => reject(new Error(`Error loading ${src}`))
        document.body.appendChild(s)
      })

    const init = async () => {
      try {
        await loadScript('https://js.openpay.mx/openpay.v1.min.js')
        await loadScript('https://js.openpay.mx/openpay-data.v1.min.js')
        if (cancelled) return

        if (!(window as any).OpenPay) {
          setIsOpenPayReady(false)
          setMessage({ type: 'error', text: 'OpenPay no está disponible en este momento' })
          return
        }

        const merchantId = import.meta.env.VITE_OPENPAY_MERCHANT_ID
        const publicKey = import.meta.env.VITE_OPENPAY_PUBLIC_KEY
        const isProduction = import.meta.env.VITE_OPENPAY_PRODUCTION === 'true'

        const OpenPay = (window as any).OpenPay
        OpenPay.setId(merchantId)
        OpenPay.setApiKey(publicKey)
        OpenPay.setSandboxMode(!isProduction)

        const sessionId = OpenPay.deviceData.setup('payment-form', 'deviceIdHiddenFieldName')
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

  function handlePayment(e: React.FormEvent) {
    e.preventDefault()

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

    if (!isOpenPayReady || !(window as any).OpenPay) {
      setMessage({ type: 'error', text: 'OpenPay no está listo. Intenta recargar.' })
      return
    }

    if (!deviceSessionId) {
      setMessage({ type: 'error', text: 'No se pudo generar el identificador del dispositivo' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    const OpenPay = (window as any).OpenPay
    OpenPay.token.create(
      {
        holder_name: card.holderName,
        card_number: cardDigits,
        expiration_month: card.expirationMonth,
        expiration_year: card.expirationYear,
        cvv2: card.cvv2
      },
      (response: any) => {
        if (response.data?.id) {
          sendPaymentToBackend(response.data.id)
          return
        }

        setIsLoading(false)
        setMessage({ type: 'error', text: response.data?.error_code ? `Error: ${response.data.error_code}` : 'Error al crear el token' })
      },
      (error: any) => {
        setIsLoading(false)
        setMessage({ type: 'error', text: error?.description || error?.data?.description || 'Error al crear el token' })
      }
    )
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

  async function sendPaymentToBackend(tokenId: string) {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const response = await fetch(`${backendUrl}/internet-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPlan!.price,
          plan_id: selectedPlan!.id,
          duration: selectedPlan!.duration,
          source_id: tokenId,
          device_session_id: deviceSessionId,
          currency: 'MXN',
          order_id: `INTERNET-${Date.now()}`,
          customer: {
            name: customer.name.split(' ')[0],
            last_name: customer.name.split(' ').slice(1).join(' ') || customer.name,
            email: customer.email,
            phone_number: customer.phone
          }
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: '¡Pago exitoso! Se han generado tus credenciales' })
        setUserCreds(data.credentials as Credentials)
        setStep(4)

        const creds = data.credentials as Credentials
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
          autoLoginMikrotik(creds.username, creds.password)
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

  function continueFromPlan() {
    if (!selectedPlan) {
      setMessage({ type: 'error', text: 'Selecciona un plan para continuar.' })
      return
    }

    setMessage(null)
    setStep(2)
  }

  function continueFromCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!customerValid) {
      setMessage({ type: 'error', text: 'Completa tus datos correctamente para continuar.' })
      return
    }

    setMessage(null)
    setStep(3)
  }

  function startAnotherPurchase() {
    clearAutoLoginTimers()
    setAutoLoginCountdown(null)
    setUserCreds(null)
    setStep(1)
    setMobilePanel('flow')
  }

  function formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const transition = { duration: 0.22, ease: 'easeOut' as const }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(17,130,148,0.22),_transparent_56%),linear-gradient(160deg,_rgba(245,252,255,1)_0%,_rgba(237,246,251,1)_42%,_rgba(250,251,244,1)_100%)] p-3 md:p-5">
      <form id="payment-form" className="hidden">
        <input type="hidden" name="deviceIdHiddenFieldName" />
      </form>

      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300/60 bg-base-100/85 px-4 py-3 shadow-lg backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Checkout Express</p>
            <h1 className="text-xl font-semibold leading-tight md:text-2xl">Pago de Internet en un solo paso visual</h1>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="badge badge-outline">SSL 256 bits</div>
            <div className="badge badge-outline">OpenPay</div>
            <div className="badge badge-outline">Soporte 24/7</div>
          </div>
        </div>

        <div className="join w-full md:hidden">
          <button type="button" className={`join-item btn flex-1 ${mobilePanel === 'flow' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMobilePanel('flow')}>
            Flujo
          </button>
          <button type="button" className={`join-item btn flex-1 ${mobilePanel === 'summary' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMobilePanel('summary')}>
            Resumen
          </button>
        </div>

        <div className="relative grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-12">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-base-300/45 backdrop-blur-sm">
              <div className="rounded-xl border border-base-100/60 bg-base-100/95 px-6 py-5 text-center shadow-xl">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-3 text-sm font-medium">Procesando pago, no cierres esta pantalla.</p>
              </div>
            </div>
          )}

          <section className={`${mobilePanel === 'flow' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col rounded-2xl border border-base-300/70 bg-base-100/90 shadow-xl backdrop-blur md:col-span-7 md:flex`}>
            <div className="border-b border-base-300/70 px-4 pb-4 pt-5 md:px-6">
              <ul className="steps steps-horizontal w-full text-xs md:text-sm">
                <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Plan</li>
                <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Datos</li>
                <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Pago</li>
              </ul>
              {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mt-4 py-2`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 md:px-6 md:py-5">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step-plan" initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={transition} className="flex h-full flex-col justify-between gap-4">
                    <div className="space-y-3 overflow-y-auto pr-1">
                      <div>
                        <h2 className="text-lg font-semibold md:text-xl">Selecciona tu plan</h2>
                        <p className="text-sm opacity-70">Elige el paquete y confirma para pasar a tus datos.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {INTERNET_PLANS.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => {
                              setSelectedPlan(plan)
                              setMessage(null)
                            }}
                            className={`card border text-left transition-all hover:scale-[1.01] ${selectedPlan?.id === plan.id ? 'border-primary bg-primary/10 shadow-md' : 'border-base-300 bg-base-100'}`}
                          >
                            <div className="card-body gap-2 p-4">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-base font-semibold">{plan.label}</h3>
                                {selectedPlan?.id === plan.id && <span className="badge badge-primary">Activo</span>}
                              </div>
                              <p className="text-xs uppercase tracking-wide opacity-65">Plan internet prepago</p>
                              <p className="text-2xl font-semibold leading-none">{formatMoney(plan.price)}</p>
                              <p className="text-xs opacity-70">Acceso inmediato por {plan.duration} minutos</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button type="button" onClick={continueFromPlan} className="btn btn-primary flex-1" disabled={!selectedPlan}>
                        Confirmar y continuar
                      </button>
                      <button type="button" onClick={() => setMobilePanel('summary')} className="btn btn-ghost md:hidden">
                        Ver resumen
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.form key="step-customer" initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={transition} className="flex h-full flex-col justify-between gap-4" onSubmit={continueFromCustomer}>
                    <div className="space-y-4 overflow-y-auto pr-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold md:text-xl">Datos del titular</h2>
                          <p className="text-sm opacity-70">Validamos tu identidad antes de cobrar.</p>
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>Volver</button>
                      </div>

                      <label className="form-control w-full gap-2">
                        <span className="label-text font-medium">Nombre completo</span>
                        <input
                          type="text"
                          placeholder="Juan Pérez García"
                          className="input input-bordered w-full"
                          value={customer.name}
                          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                          required
                        />
                      </label>

                      <label className="form-control w-full gap-2">
                        <span className="label-text font-medium">Correo electrónico</span>
                        <div className="join w-full">
                          <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            className={`input join-item w-full ${customer.email.length > 0 && !emailValid ? 'input-error' : 'input-bordered'}`}
                            value={customer.email}
                            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                            required
                          />
                          <span className="join-item btn btn-ghost btn-square" aria-hidden>
                            {emailValid ? '✓' : '@'}
                          </span>
                        </div>
                        {customer.email.length > 0 && !emailValid && <span className="text-xs text-error">Ingresa un correo válido.</span>}
                      </label>

                      <label className="form-control w-full gap-2">
                        <span className="label-text font-medium">Teléfono</span>
                        <div className="join w-full">
                          <span className="join-item btn btn-ghost pointer-events-none">+52</span>
                          <IMaskInput
                            mask="000 000 0000"
                            className={`input join-item w-full ${customer.phone.length > 0 && !phoneValid ? 'input-error' : 'input-bordered'}`}
                            placeholder="555 123 4567"
                            value={customer.phone}
                            onAccept={(value: string) => setCustomer({ ...customer, phone: value })}
                          />
                        </div>
                        {customer.phone.length > 0 && !phoneValid && <span className="text-xs text-error">Necesitamos 10 dígitos para continuar.</span>}
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <button type="submit" className="btn btn-primary flex-1" disabled={!customerValid}>Continuar al pago</button>
                      <button type="button" onClick={() => setMobilePanel('summary')} className="btn btn-ghost md:hidden">Resumen</button>
                    </div>
                  </motion.form>
                )}

                {step === 3 && (
                  <motion.form key="step-payment" initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={transition} className="flex h-full flex-col justify-between gap-4" onSubmit={handlePayment}>
                    <div className="space-y-4 overflow-y-auto pr-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold md:text-xl">Método de pago</h2>
                          <p className="text-sm opacity-70">Todo se procesa aquí mismo, sin salir de pantalla.</p>
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>Volver</button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button type="button" className={`btn h-auto flex-col py-3 text-left ${paymentMethod === 'card' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPaymentMethod('card')}>
                          <span className="text-sm font-semibold">Tarjeta</span>
                          <span className="text-xs font-normal">Crédito o débito</span>
                        </button>
                        <button type="button" className={`btn h-auto flex-col py-3 text-left ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPaymentMethod('cash')}>
                          <span className="text-sm font-semibold">Efectivo</span>
                          <span className="text-xs font-normal">OXXO / tiendas</span>
                        </button>
                        <button type="button" className={`btn h-auto flex-col py-3 text-left ${paymentMethod === 'spei' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPaymentMethod('spei')}>
                          <span className="text-sm font-semibold">Transferencia</span>
                          <span className="text-xs font-normal">SPEI</span>
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {paymentMethod === 'card' ? (
                          <motion.div key="card-method" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={transition} className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-4">
                            <label className="form-control gap-1">
                              <span className="label-text font-medium">Nombre del titular</span>
                              <input
                                type="text"
                                autoComplete="off"
                                data-openpay-card="holder_name"
                                className="input input-bordered w-full"
                                placeholder="Como aparece en la tarjeta"
                                value={card.holderName}
                                onChange={(e) => setCard({ ...card, holderName: e.target.value })}
                                required
                              />
                            </label>

                            <label className="form-control gap-1">
                              <span className="label-text font-medium">Número de tarjeta</span>
                              <div className="join w-full">
                                <IMaskInput
                                  mask="0000 0000 0000 0000[ 000]"
                                  autoComplete="off"
                                  data-openpay-card="card_number"
                                  className="input input-bordered join-item w-full"
                                  placeholder="0000 0000 0000 0000"
                                  value={card.cardNumber}
                                  onAccept={(value: string) => setCard({ ...card, cardNumber: value })}
                                />
                                <span className="join-item btn btn-ghost pointer-events-none min-w-24 text-xs">{cardBrand}</span>
                              </div>
                            </label>

                            <div className="grid grid-cols-3 gap-3">
                              <label className="form-control gap-1">
                                <span className="label-text text-xs font-medium">Mes</span>
                                <IMaskInput
                                  mask="00"
                                  data-openpay-card="expiration_month"
                                  className="input input-bordered"
                                  placeholder="MM"
                                  value={card.expirationMonth}
                                  onAccept={(value: string) => setCard({ ...card, expirationMonth: value })}
                                />
                              </label>

                              <label className="form-control gap-1">
                                <span className="label-text text-xs font-medium">Año</span>
                                <IMaskInput
                                  mask="00"
                                  data-openpay-card="expiration_year"
                                  className="input input-bordered"
                                  placeholder="YY"
                                  value={card.expirationYear}
                                  onAccept={(value: string) => setCard({ ...card, expirationYear: value })}
                                />
                              </label>

                              <label className="form-control gap-1">
                                <span className="label-text text-xs font-medium">CVV</span>
                                <IMaskInput
                                  mask="000[0]"
                                  autoComplete="off"
                                  data-openpay-card="cvv2"
                                  className="input input-bordered"
                                  placeholder="***"
                                  value={card.cvv2}
                                  onAccept={(value: string) => setCard({ ...card, cvv2: value })}
                                />
                              </label>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div key="non-card-method" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={transition} className="alert alert-info">
                            <span className="text-sm">Próximamente habilitaremos esta modalidad sin salir del checkout. Hoy puedes finalizar con tarjeta.</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="alert border border-base-300 bg-base-200/80 py-3">
                        <div>
                          <p className="font-semibold">Pago seguro y cifrado</p>
                          <p className="text-sm opacity-75">Protección en tránsito con tokenización OpenPay y SSL 256 bits.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button type="submit" disabled={!canSubmitPayment} className={`btn btn-primary flex-1 text-base ${isLoading ? 'loading' : ''}`}>
                        {isLoading ? 'Procesando...' : isOpenPayReady ? `Pagar ${formatMoney(total)}` : 'Cargando OpenPay...'}
                      </button>
                      <button type="button" onClick={() => setMobilePanel('summary')} className="btn btn-ghost md:hidden">Resumen</button>
                    </div>
                  </motion.form>
                )}

                {step === 4 && userCreds && (
                  <motion.div key="step-success" initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={transition} className="flex h-full flex-col justify-between gap-4">
                    <div className="space-y-3 overflow-y-auto pr-1">
                      <div className="alert alert-success">
                        <div>
                          <h3 className="font-semibold">Acceso activado</h3>
                          <p className="text-sm">Tu pago quedó aplicado y las credenciales ya están listas.</p>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <div className="card border border-base-300 bg-base-100">
                          <div className="card-body p-4">
                            <p className="text-xs uppercase tracking-wide opacity-65">Usuario (login)</p>
                            <p className="font-mono text-sm break-all">{userCreds.username}</p>
                            <button type="button" onClick={() => navigator.clipboard.writeText(userCreds.username)} className="btn btn-ghost btn-xs w-fit">Copiar usuario</button>
                          </div>
                        </div>

                        <div className="card border border-base-300 bg-base-100">
                          <div className="card-body p-4">
                            <p className="text-xs uppercase tracking-wide opacity-65">Contraseña</p>
                            <p className="font-mono text-sm break-all">{userCreds.password}</p>
                            <button type="button" onClick={() => navigator.clipboard.writeText(userCreds.password)} className="btn btn-ghost btn-xs w-fit">Copiar contraseña</button>
                          </div>
                        </div>

                        <div className="card border border-base-300 bg-base-100">
                          <div className="card-body p-4">
                            <p className="text-xs uppercase tracking-wide opacity-65">Vigencia</p>
                            <p className="text-sm">{userCreds.expiresAt}</p>
                          </div>
                        </div>
                      </div>

                      {autoLoginCountdown !== null && (
                        <div className="alert alert-info py-2">
                          <span className="text-sm">Auto-login en {autoLoginCountdown} segundos...</span>
                        </div>
                      )}
                    </div>

                    <button type="button" onClick={startAnotherPurchase} className="btn btn-primary w-full">Comprar otro plan</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <aside className={`${mobilePanel === 'summary' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col rounded-2xl border border-base-300/70 bg-base-100/95 p-4 shadow-xl md:col-span-5 md:flex md:p-5`}>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Resumen de compra</p>
                <h2 className="text-lg font-semibold md:text-xl">Detalles del pedido</h2>
              </div>

              <div className="card border border-base-300 bg-base-100">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{selectedPlan ? `Plan ${selectedPlan.label}` : 'Selecciona un plan'}</p>
                      <p className="text-sm opacity-70">{selectedPlan ? `${selectedPlan.duration} minutos de conexión` : 'Elige tu paquete para calcular total.'}</p>
                    </div>
                    <span className="badge badge-outline">Pago único</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-70">Subtotal</span>
                  <span className="font-medium">{formatMoney(subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="opacity-70">IVA (16%)</span>
                  <span className="font-medium">{formatMoney(tax)}</span>
                </div>
                <div className="my-3 h-px bg-base-300"></div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total a pagar</span>
                  <span className="text-xl font-semibold text-primary">{formatMoney(total)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm font-semibold">Estado de flujo</p>
                <div className="mt-2 space-y-2 text-sm">
                  <p className="flex items-center justify-between"><span className="opacity-70">Paso actual</span><span className="badge badge-primary">{step <= 3 ? step : 3}/3</span></p>
                  <p className="flex items-center justify-between"><span className="opacity-70">Método seleccionado</span><span>{paymentMethod === 'card' ? 'Tarjeta' : paymentMethod === 'cash' ? 'Efectivo' : 'SPEI'}</span></p>
                  <p className="flex items-center justify-between"><span className="opacity-70">Recurrencia</span><span>No activa</span></p>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm font-semibold">Soporte rápido</p>
                <p className="mt-2 text-sm opacity-75">Si tienes un problema durante el pago, te ayudamos en menos de 5 minutos.</p>
                <button type="button" className="btn btn-outline btn-sm mt-3 w-full">Contactar soporte</button>
              </div>
            </div>

            <button type="button" className="btn btn-primary mt-4 md:hidden" onClick={() => setMobilePanel('flow')}>
              Volver al flujo
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
