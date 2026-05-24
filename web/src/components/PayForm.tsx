import React, { useEffect, useRef, useState } from "react"

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

const INTERNET_PLANS: InternetPlan[] = [
  { id: 'plan_5m', duration: 5, price: 10, label: '5 Minutos' },
  { id: 'plan_10m', duration: 10, price: 15, label: '10 Minutos' },
  { id: 'plan_15m', duration: 15, price: 20, label: '15 Minutos' }
]

const DEFAULT_MIKROTIK_LOGIN_URL = 'http://internet.online/login'

export default function PayForm(): React.ReactElement {
  const [deviceSessionId, setDeviceSessionId] = useState<string>('')
  const [isOpenPayReady, setIsOpenPayReady] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [customer, setCustomer] = useState<CustomerData>({ name: '', email: '', phone: '' })
  const [card, setCard] = useState<CardData>({ holderName: '', cardNumber: '', expirationMonth: '', expirationYear: '', cvv2: '' })
  const [selectedPlan, setSelectedPlan] = useState<InternetPlan | null>(null)
  const [userCreds, setUserCreds] = useState<Credentials | null>(null)
  const [autoLoginCountdown, setAutoLoginCountdown] = useState<number | null>(null)
  const autoLoginTimeoutRef = useRef<number | null>(null)
  const autoLoginIntervalRef = useRef<number | null>(null)

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

    if (!customer.name || !customer.email || !customer.phone) {
      setMessage({ type: 'error', text: 'Por favor completa todos los campos' })
      return
    }

    if (!selectedPlan) {
      setMessage({ type: 'error', text: 'Por favor selecciona un plan' })
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
        card_number: card.cardNumber,
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

  async function autoLoginMikrotik(username: string, password: string) {
    const loginUrl = import.meta.env.VITE_MIKROTIK_LOGIN_URL || DEFAULT_MIKROTIK_LOGIN_URL

    try {
      await fetch(loginUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          username,
          password,
          dst: 'https://www.google.com'
        })
      })

      window.location.href = 'https://www.google.com'
    } catch (error) {
      console.error('Error en el auto-login:', error)
    }
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

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="w-full max-w-3xl mx-auto">
        <div className="card glass shadow-xl rounded-2xl">
          <div className="card-body">
            <h2 className="card-title text-2xl sm:text-3xl font-semibold">Internet por Tiempo</h2>
            <p className="text-sm opacity-70">Acceso inmediato después de pagar</p>

            {message && <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-2`}><p className="text-sm">{message.text}</p></div>}

            {userCreds ? (
              <div className="alert alert-success">
                <h3 className="font-bold">Acceso Activado</h3>
                <div className="mt-4 space-y-2">
                  <div className="card"><div className="card-body"><p className="text-sm">Usuario (SSID/Login)</p><p className="font-mono wrap-break-word">{userCreds.username}</p><button onClick={() => navigator.clipboard.writeText(userCreds.username)} className="btn btn-ghost btn-sm mt-2">Copiar</button></div></div>
                  <div className="card"><div className="card-body"><p className="text-sm">Contraseña</p><p className="font-mono wrap-break-word">{userCreds.password}</p><button onClick={() => navigator.clipboard.writeText(userCreds.password)} className="btn btn-ghost btn-sm mt-2">Copiar</button></div></div>
                  <div className="card"><div className="card-body"><p className="text-sm">Válido hasta</p><p>{userCreds.expiresAt}</p></div></div>
                </div>
                <div className="alert alert-info mt-4"><p>El acceso se activa inmediatamente. Accede con estas credenciales en el portal cautivo.</p></div>
                {autoLoginCountdown !== null && (
                  <p className="text-sm mt-2">Auto-login en {autoLoginCountdown} segundos...</p>
                )}
                <button onClick={() => { clearAutoLoginTimers(); setAutoLoginCountdown(null); setUserCreds(null); setSelectedPlan(null) }} className="btn btn-primary mt-4">Comprar otro plan</button>
              </div>
            ) : (
              <>
                <div className="divider"></div>
                <h3 className="font-semibold">Selecciona tu Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {INTERNET_PLANS.map((plan) => (
                    <div key={plan.id} onClick={() => setSelectedPlan(plan)} className={`card card-compact cursor-pointer ${selectedPlan?.id === plan.id ? 'bg-primary text-primary-content' : 'card-bordered'}`}>
                      <div className="card-body p-3"><h4 className="card-title text-base">{plan.label}</h4><p className="text-lg font-semibold">${plan.price}</p><p className="text-xs opacity-60">MXN</p></div>
                    </div>
                  ))}
                </div>

                <div className="divider"></div>

                <form id="payment-form" className="space-y-4" onSubmit={handlePayment}>
                  <input type="hidden" name="deviceIdHiddenFieldName" />

                  <h3 className="text-lg font-semibold">Tus Datos</h3>

                  <div className="form-control">
                    <label className="label"><span className="label-text font-semibold">Nombre Completo</span></label>
                    <input type="text" placeholder="Juan Pérez García" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="input input-bordered w-full" required />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text font-semibold">Email</span></label>
                    <input type="email" placeholder="correo@ejemplo.com" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="input input-bordered w-full" required />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text font-semibold">Teléfono</span></label>
                    <input type="tel" placeholder="5551234567" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="input input-bordered w-full" required />
                  </div>

                  <div className="divider"></div>

                  <h3 className="text-lg font-semibold">Datos de Tarjeta</h3>

                  <div className="form-control w-full">
                    <label className="label"><span className="label-text font-semibold">Nombre del Titular</span></label>
                    <input type="text" placeholder="Como aparece en la tarjeta" autoComplete="off" data-openpay-card="holder_name" value={card.holderName} onChange={(e) => setCard({ ...card, holderName: e.target.value })} className="input input-bordered w-full" required />
                  </div>

                  <div className="form-control w-full">
                    <label className="label"><span className="label-text font-semibold">Número de Tarjeta</span></label>
                    <input type="text" placeholder="0000 0000 0000 0000" autoComplete="off" data-openpay-card="card_number" value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: e.target.value })} className="input input-bordered w-full" required />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="form-control">
                      <label className="label"><span className="label-text text-sm font-semibold">Mes</span></label>
                      <input type="text" placeholder="MM" data-openpay-card="expiration_month" value={card.expirationMonth} onChange={(e) => setCard({ ...card, expirationMonth: e.target.value })} className="input input-bordered input-sm" required />
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text text-sm font-semibold">Año</span></label>
                      <input type="text" placeholder="YY" data-openpay-card="expiration_year" value={card.expirationYear} onChange={(e) => setCard({ ...card, expirationYear: e.target.value })} className="input input-bordered input-sm" required />
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text text-sm font-semibold">CVV</span></label>
                      <input type="text" placeholder="***" autoComplete="off" data-openpay-card="cvv2" value={card.cvv2} onChange={(e) => setCard({ ...card, cvv2: e.target.value })} className="input input-bordered input-sm" required />
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="alert"><div><p className="font-semibold">Pago 100% Seguro</p><p className="text-sm">Tus datos se protegen con encriptación SSL de 256 bits</p></div></div>

                  <button type="submit" disabled={isLoading || !isOpenPayReady || !selectedPlan} className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}>
                    {isLoading ? 'Procesando...' : !selectedPlan ? 'Selecciona un plan' : isOpenPayReady ? `Pagar $${selectedPlan.price}` : 'Cargando OpenPay...'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p>¿Problemas? Contacta al soporte</p>
          <p>Disponibles 24/7</p>
        </div>
      </div>
    </div>
  )
}
