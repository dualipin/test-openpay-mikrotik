import type { CheckoutController } from '../../../hooks/useCheckout'
import { INTERNET_PLANS } from '../types'

interface ProductStepProps {
  checkout: CheckoutController
}

export default function ProductStep({ checkout }: ProductStepProps) {
  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="space-y-3 overflow-y-auto pr-1">
        <div>
          <h2 className="text-lg font-semibold md:text-xl">Selecciona tu plan</h2>
          <p className="text-sm opacity-70">Elige el paquete y confirma para pasar a tus datos.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pr-1">
          {INTERNET_PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => checkout.selectPlan(plan)}
              className={`card border text-left transition-all hover:brightness-150 ${checkout.selectedPlan?.id === plan.id ? 'border-primary bg-primary/10 shadow-md' : 'border-base-300 bg-base-100'}`}
            >
              <div className="card-body gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{plan.label}</h3>
                  {checkout.selectedPlan?.id === plan.id && <span className="badge badge-primary">Activo</span>}
                </div>
                <p className="text-xs uppercase tracking-wide opacity-65">Plan internet prepago</p>
                <p className="text-2xl font-semibold leading-none">{checkout.formatMoney(plan.price)}</p>
                <p className="text-xs opacity-70">Acceso inmediato por {plan.duration} minutos</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={checkout.continueFromPlan} className="btn btn-primary flex-1" disabled={!checkout.selectedPlan}>
          Confirmar y continuar
        </button>
        <button type="button" onClick={() => checkout.setMobilePanel('summary')} className="btn btn-ghost md:hidden">
          Ver resumen
        </button>
      </div>
    </div>
  )
}