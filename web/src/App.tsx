import PayForm from './components/PayForm'

function App() {
  return (
    <div className="min-h-screen bg-base-200 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold mb-2">Portal de Internet</h1>
          <p className="text-base md:text-lg opacity-80">Compra por tiempo y activa tu acceso al instante</p>
        </div>
        <PayForm />
        <div className="text-center mt-8 text-sm opacity-70">
          <p>¿Necesitas ayuda? Contacta a nuestro equipo de soporte</p>
        </div>
      </div>
    </div>
  )
}

export default App
