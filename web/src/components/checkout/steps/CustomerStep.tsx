import { IMaskInput } from 'react-imask'
import type { CheckoutController } from '../../../hooks/useCheckout'

interface CustomerStepProps {
  checkout: CheckoutController
}

export default function CustomerStep({ checkout }: CustomerStepProps) {
  return (
    <form className="flex h-full flex-col justify-between gap-4" onSubmit={checkout.continueFromCustomer}>
      <div className="space-y-4 overflow-y-auto pr-1 flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold md:text-xl">Datos del titular</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => checkout.setStep(1)}>
            Volver
          </button>
        </div>

        <label className="form-control w-full gap-2">
          <span className="label-text font-medium">Nombre completo</span>
          <input
            type="text"
            placeholder="Juan Pérez García"
            className="input input-bordered w-full"
            value={checkout.customer.name}
            onChange={(event) => checkout.updateCustomer({ name: event.target.value })}
            required
          />
        </label>

        <label className="form-control w-full gap-2">
          <span className="label-text font-medium">Correo electrónico</span>
          <div className="join w-full">
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className={`input join-item w-full ${checkout.customer.email.length > 0 && !checkout.emailValid ? 'input-error' : 'input-bordered'}`}
              value={checkout.customer.email}
              onChange={(event) => checkout.updateCustomer({ email: event.target.value })}
              required
            />
            <span className="join-item btn btn-ghost btn-square" aria-hidden>
              {checkout.emailValid ? '✓' : '@'}
            </span>
          </div>
          {checkout.customer.email.length > 0 && !checkout.emailValid && <span className="text-xs text-error">Ingresa un correo válido.</span>}
        </label>

        <label className="form-control w-full gap-2">
          <span className="label-text font-medium">Teléfono</span>
          <div className="join w-full">
            <span className="join-item btn btn-ghost pointer-events-none">+52</span>
            <IMaskInput
              mask="000 000 0000"
              className={`input join-item w-full ${checkout.customer.phone.length > 0 && !checkout.phoneValid ? 'input-error' : 'input-bordered'}`}
              placeholder="555 123 4567"
              value={checkout.customer.phone}
              onAccept={(value: string) => checkout.updateCustomer({ phone: value })}
            />
          </div>
          {checkout.customer.phone.length > 0 && !checkout.phoneValid && <span className="text-xs text-error">Necesitamos 10 dígitos para continuar.</span>}
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="btn btn-primary flex-1" disabled={!checkout.customerValid}>
          Continuar al pago
        </button>
        <button type="button" onClick={() => checkout.setMobilePanel('summary')} className="btn btn-ghost md:hidden">
          Resumen
        </button>
      </div>
    </form>
  )
}