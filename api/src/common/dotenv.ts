import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
    PORT: z.number().optional().default(3000),
    OPENPAY_PRIVATE_API_KEY: z.string(),
    OPENPAY_MERCHANT_ID: z.string(),
    OPENPAY_URI: z.string(),
    OPENPAY_PRODUCTION: z.string().transform((val) => val === 'true'),
    MIKROTIK_HOST: z.string(),
    MIKROTIK_USER: z.string(),
    MIKROTIK_PASSWORD: z.string(),
    MIKROTIK_PORT: z.coerce.number().optional().default(443),
    MIKROTIK_REST_USE_HTTPS: z.string().optional().default('true').transform((val) => val === 'true'),
    MIKROTIK_REST_ALLOW_INSECURE: z.string().optional().default('false').transform((val) => val === 'true'),
    CORS_ORIGIN: z.string().optional().default('*'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
    console.error('Error parsing environment variables:', parsed.error.message)
    throw new Error('Invalid environment variables')
}

export const env = {
    ...parsed.data
}