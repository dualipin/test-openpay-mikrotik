import { AnimatePresence, motion } from 'framer-motion'
import CheckoutSteps from './CheckoutSteps'
import OrderSummary from './OrderSummary'
import ProductStep from './steps/ProductStep'
import CustomerStep from './steps/CustomerStep'
import PaymentStep from './steps/PaymentStep'
import { useCheckout } from '../../hooks/useCheckout'

export default function CheckoutLayout() {
  const checkout = useCheckout()
  const transition = { duration: 0.22, ease: 'easeOut' as const }

  const renderStep = () => {
    switch (checkout.currentStep) {
      case 1:
        return <ProductStep checkout={checkout} />
      case 2:
        return <CustomerStep checkout={checkout} />
      case 3:
        return <PaymentStep checkout={checkout} />
      case 4:
        if (!checkout.userCreds) {
          return null
        }

        const userCreds = checkout.userCreds

        return (
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
                    <button type="button" onClick={() => void navigator.clipboard.writeText(userCreds.username)} className="btn btn-ghost btn-xs w-fit">
                      Copiar usuario
                    </button>
                  </div>
                </div>

                <div className="card border border-base-300 bg-base-100">
                  <div className="card-body p-4">
                    <p className="text-xs uppercase tracking-wide opacity-65">Contraseña</p>
                    <p className="font-mono text-sm break-all">{userCreds.password}</p>
                    <button type="button" onClick={() => void navigator.clipboard.writeText(userCreds.password)} className="btn btn-ghost btn-xs w-fit">
                      Copiar contraseña
                    </button>
                  </div>
                </div>

                <div className="card border border-base-300 bg-base-100">
                  <div className="card-body p-4">
                    <p className="text-xs uppercase tracking-wide opacity-65">Vigencia</p>
                    <p className="text-sm">{userCreds.expiresAt}</p>
                  </div>
                </div>
              </div>

              {checkout.autoLoginCountdown !== null && (
                <div className="alert alert-info py-2">
                  <span className="text-sm">Auto-login en {checkout.autoLoginCountdown} segundos...</span>
                </div>
              )}
            </div>

            <button type="button" onClick={checkout.startAnotherPurchase} className="btn btn-primary w-full">
              Comprar otro plan
            </button>
          </motion.div>
        )
      default:
        return <ProductStep checkout={checkout} />
    }
  }

  return (
    <div className="h-dvh overflow-hidden p-3 md:p-5">
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
          <button type="button" className={`join-item btn flex-1 ${checkout.mobilePanel === 'flow' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => checkout.setMobilePanel('flow')}>
            Flujo
          </button>
          <button type="button" className={`join-item btn flex-1 ${checkout.mobilePanel === 'summary' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => checkout.setMobilePanel('summary')}>
            Resumen
          </button>
        </div>

        <div className="relative grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-12">
          {checkout.isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-base-300/45 backdrop-blur-sm">
              <div className="rounded-xl border border-base-100/60 bg-base-100/95 px-6 py-5 text-center shadow-xl">
                {/* <span className="loading loading-spinner loading-lg text-primary"></span> */}
                <p className="mt-3 text-sm font-medium">Procesando pago, no cierres esta pantalla.</p>
                <span className='loading loading-dots loading-lg mt-3'></span>
              </div>
            </div>
          )}

          <section className={`${checkout.mobilePanel === 'flow' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col rounded-2xl border border-base-300/70 bg-base-100/90 shadow-xl backdrop-blur md:col-span-7 md:flex`}>
            <CheckoutSteps checkout={checkout} />

            <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 md:px-6 md:py-5">
              <AnimatePresence mode="wait">
                <motion.div key={checkout.currentStep} initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={transition} className="h-full">
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          <OrderSummary checkout={checkout} />
        </div>
      </div>
    </div>
  )
}