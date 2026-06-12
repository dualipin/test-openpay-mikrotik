import type { CheckoutController } from '../../hooks/useCheckout'

interface CheckoutStepsProps {
  checkout: CheckoutController
}

export default function CheckoutSteps({ checkout }: CheckoutStepsProps) {
  const { currentStep, message } = checkout

  return (
    <div className="border-b border-base-300/70 px-4 pb-4 pt-5 md:px-6">
      <ul className="steps steps-horizontal w-full text-xs md:text-sm">
        <li className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>Plan</li>
        <li className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>Datos</li>
        <li className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>Pago</li>
      </ul>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mt-4 py-2`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}
    </div>
  )
}