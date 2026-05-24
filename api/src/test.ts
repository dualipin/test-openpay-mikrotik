import Openpay from 'openpay'
import { env } from './common/dotenv'
const openpay = new Openpay(env.OPENPAY_MERCHANT_ID, env.OPENPAY_PRIVATE_API_KEY, env.OPENPAY_PRODUCTION)