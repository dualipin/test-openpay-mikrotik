import { env } from '@/common/dotenv'
import { app } from './server'

const start = async () => {
  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})