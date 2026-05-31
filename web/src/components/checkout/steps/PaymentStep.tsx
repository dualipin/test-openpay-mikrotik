import { AnimatePresence, motion } from 'framer-motion'
import { IMaskInput } from 'react-imask'
import type { CheckoutController } from '../../../hooks/useCheckout'

interface PaymentStepProps {
  checkout: CheckoutController
}

export default function PaymentStep({ checkout }: PaymentStepProps) {
  const transition = { duration: 0.22, ease: 'easeOut' as const }

  return (
    <form className="flex h-full flex-col justify-between gap-4" onSubmit={checkout.handlePayment}>
      <div className="space-y-4 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold md:text-xl">Método de pago</h2>
            <p className="text-sm opacity-70">Todo se procesa aquí mismo, sin salir de pantalla.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => checkout.setStep(2)}>
            Volver
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" className={`btn h-auto flex-col py-3 text-left ${checkout.paymentMethod === 'card' ? 'btn-primary' : 'btn-outline'}`} onClick={() => checkout.choosePaymentMethod('card')}>
            <span className="text-sm font-semibold">Tarjeta</span>
            <span className="text-xs font-normal">Crédito o débito</span>
          </button>
          {/* <button type="button" className={`btn h-auto flex-col py-3 text-left ${checkout.paymentMethod === 'cash' ? 'btn-primary' : 'btn-outline'}`} onClick={() => checkout.choosePaymentMethod('cash')}>
            <span className="text-sm font-semibold">Efectivo</span>
            <span className="text-xs font-normal">OXXO / tiendas</span>
          </button>
          <button type="button" className={`btn h-auto flex-col py-3 text-left ${checkout.paymentMethod === 'spei' ? 'btn-primary' : 'btn-outline'}`} onClick={() => checkout.choosePaymentMethod('spei')}>
            <span className="text-sm font-semibold">Transferencia</span>
            <span className="text-xs font-normal">SPEI</span>
          </button> */}
        </div>

        <AnimatePresence mode="wait">
          {checkout.paymentMethod === 'card' ? (
            <motion.div key="card-method" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={transition} className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-4">
              <label className="form-control gap-1">
                <span className="label-text font-medium">Nombre del titular</span>
                <input
                  type="text"
                  autoComplete="off"
                  data-openpay-card="holder_name"
                  className="input input-bordered w-full"
                  placeholder="Como aparece en la tarjeta"
                  value={checkout.card.holderName}
                  onChange={(event) => checkout.updateCard({ holderName: event.target.value })}
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
                    value={checkout.card.cardNumber}
                    onAccept={(value: string) => checkout.updateCard({ cardNumber: value })}
                  />
                  <span className="join-item btn btn-ghost pointer-events-none min-w-24 text-xs">{checkout.cardBrand}</span>
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
                    value={checkout.card.expirationMonth}
                    onAccept={(value: string) => checkout.updateCard({ expirationMonth: value })}
                  />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text text-xs font-medium">Año</span>
                  <IMaskInput
                    mask="00"
                    data-openpay-card="expiration_year"
                    className="input input-bordered"
                    placeholder="YY"
                    value={checkout.card.expirationYear}
                    onAccept={(value: string) => checkout.updateCard({ expirationYear: value })}
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
                    value={checkout.card.cvv2}
                    onAccept={(value: string) => checkout.updateCard({ cvv2: value })}
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
        <button type="submit" disabled={!checkout.canSubmitPayment} className={`btn btn-primary flex-1 text-base ${checkout.isLoading ? 'loading' : ''}`}>
          {checkout.isLoading ? 'Procesando...' : checkout.isOpenPayReady ? `Pagar ${checkout.formatMoney(checkout.total)}` : 'Cargando OpenPay...'}
        </button>
        <button type="button" onClick={() => checkout.setMobilePanel('summary')} className="btn btn-ghost md:hidden">
          Resumen
        </button>
      </div>
    </form>
  )
}