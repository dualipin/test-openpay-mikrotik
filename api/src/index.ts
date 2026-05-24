import { env } from '@/common/dotenv'
import { app } from './server'

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`)
})