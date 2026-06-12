import type { CheckoutController } from '../../hooks/useCheckout'

interface OrderSummaryProps {
  checkout: CheckoutController
}

export default function OrderSummary({ checkout }: OrderSummaryProps) {
  return (
    <aside className={`${checkout.mobilePanel === 'summary' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col rounded-2xl border border-base-300/70 bg-base-100/95 p-4 shadow-xl md:col-span-5 md:flex md:p-5`}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Resumen de compra</p>
          <h2 className="text-lg font-semibold md:text-xl">Detalles del pedido</h2>
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{checkout.selectedPlan ? `Plan ${checkout.selectedPlan.label}` : 'Selecciona un plan'}</p>
                <p className="text-sm opacity-70">{checkout.selectedPlan ? `${checkout.selectedPlan.duration} minutos de conexión` : 'Elige tu paquete para calcular total.'}</p>
              </div>
              <span className="badge badge-outline">Pago único</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-70">Precio neto</span>
            <span className="font-medium">{checkout.formatMoney(checkout.subtotal)}</span>
          </div>
          <div className="my-3 h-px bg-base-300"></div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total a pagar</span>
            <span className="text-xl font-semibold text-primary">{checkout.formatMoney(checkout.total)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="text-sm font-semibold">Estado de flujo</p>
          <div className="mt-2 space-y-2 text-sm">
            <p className="flex items-center justify-between"><span className="opacity-70">Paso actual</span><span className="badge badge-primary">{checkout.currentStep <= 3 ? checkout.currentStep : 3}/3</span></p>
            <p className="flex items-center justify-between"><span className="opacity-70">Método seleccionado</span><span>{checkout.paymentMethod === 'card' ? 'Tarjeta' : checkout.paymentMethod === 'cash' ? 'Efectivo' : 'SPEI'}</span></p>
            <p className="flex items-center justify-between"><span className="opacity-70">Recurrencia</span><span>No activa</span></p>
          </div>
        </div>

        {/* <div className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="text-sm font-semibold">Soporte rápido</p>
          <p className="mt-2 text-sm opacity-75">Si tienes un problema durante el pago, te ayudamos en menos de 5 minutos.</p>
          <button type="button" className="btn btn-outline btn-sm mt-3 w-full">Contactar soporte</button>
        </div> */}
      </div>

      <button type="button" className="btn btn-primary mt-4 md:hidden" onClick={() => checkout.setMobilePanel('flow')}>
        Volver al flujo
      </button>
    </aside>
  )
}