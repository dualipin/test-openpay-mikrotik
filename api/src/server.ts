import express from 'express'
import Openpay from 'openpay'
import { env } from './common/dotenv'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import https from 'https'

export const app = express()

app.use(express.json())

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN)
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
	if (req.method === 'OPTIONS') {
		res.sendStatus(204)
		return
	}
	next()
})

// Configuración de OpenPay
const openpay = new Openpay(
	env.OPENPAY_MERCHANT_ID,
	env.OPENPAY_PRIVATE_API_KEY,
	env.OPENPAY_PRODUCTION
)

// Configuración de MikroTik
const MIKROTIK_CONFIG = {
	host: env.MIKROTIK_HOST,
	user: env.MIKROTIK_USER,
	password: env.MIKROTIK_PASSWORD,
	port: env.MIKROTIK_PORT,
	useHttps: env.MIKROTIK_REST_USE_HTTPS,
	allowInsecure: env.MIKROTIK_REST_ALLOW_INSECURE
}

const mikrotikClient = axios.create({
	baseURL: `${MIKROTIK_CONFIG.useHttps ? 'https' : 'http'}://${MIKROTIK_CONFIG.host}:${MIKROTIK_CONFIG.port}/rest`,
	auth: {
		username: MIKROTIK_CONFIG.user,
		password: MIKROTIK_CONFIG.password
	},
	httpsAgent: MIKROTIK_CONFIG.allowInsecure
		? new https.Agent({ rejectUnauthorized: false })
		: undefined
})

// Crear carpeta de pagos si no existe
const paymentsDir = path.join(process.cwd(), 'payments')
if (!fs.existsSync(paymentsDir)) {
	fs.mkdirSync(paymentsDir, { recursive: true })
}

type CustomerInput = {
	name: string
	last_name: string
	email: string
	phone_number?: string
}

type PaymentRequest = {
	method: 'card'
	amount: number
	description: string
	source_id: string
	device_session_id: string
	currency?: string
	order_id?: string
	customer: CustomerInput
}

type InternetPaymentRequest = {
	amount: number
	plan_id: string
	duration: number // en minutos
	source_id: string
	device_session_id: string
	currency?: string
	order_id?: string
	customer: CustomerInput
}

const createCharge = (payload: PaymentRequest) =>
	new Promise((resolve, reject) => {
		openpay.charges.create(payload, (error: unknown, charge: unknown) => {
			if (error) {
				reject(error)
				return
			}
			resolve(charge)
		})
	})

// Generar credenciales únicas
const generateCredentials = () => {
	const timestamp = Date.now()
	const random = Math.random().toString(36).substring(2, 8).toUpperCase()
	const username = `GUEST_${timestamp}_${random}`
	const password = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12)
	return { username, password }
}

// Crear usuario Hotspot en MikroTik
const createHotspotUser = async (username: string, password: string, duration: number) => {
	try {
		// Calcular fecha de expiración (duración en minutos)
		const expiryDate = new Date()
		expiryDate.setMinutes(expiryDate.getMinutes() + duration)

		const hours = Math.floor(duration / 60)
		const minutes = duration % 60
		const uptime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

		await mikrotikClient.post('/ip/hotspot/user', {
			name: username,
			password,
			profile: 'default',
			disabled: false,
			'limit-uptime': uptime
		})

		console.log(`Usuario Hotspot creado via REST: ${username}`)

		return {
			success: true,
			username,
			password,
			expiresAt: expiryDate.toLocaleString('es-MX'),
			expiryDate
		}
	} catch (error) {
		console.error('Error creating Hotspot user:', error)
		throw error
	}
}

// Guardar registro de compra
const saveInternetPaymentRecord = (chargeData: any, customerData: CustomerInput, amount: number, plan: { duration: number }, credentials: any) => {
	try {
		const filename = `internet_${chargeData.id}_${Date.now()}.json`
		const filepath = path.join(paymentsDir, filename)

		const paymentRecord = {
			transaction_id: chargeData.id,
			status: chargeData.status,
			amount: amount,
			currency: chargeData.currency || 'MXN',
			plan: {
				duration: plan.duration,
				unit: 'minutes'
			},
			customer: {
				name: customerData.name,
				last_name: customerData.last_name,
				email: customerData.email,
				phone_number: customerData.phone_number
			},
			credentials: {
				username: credentials.username,
				password: credentials.password,
				expires_at: credentials.expiresAt
			},
			created_at: new Date().toISOString(),
			openpay_response: {
				id: chargeData.id,
				status: chargeData.status,
				amount: chargeData.amount
			}
		}

		fs.writeFileSync(filepath, JSON.stringify(paymentRecord, null, 2))
		console.log(`Internet payment record saved: ${filename}`)
		return filename
	} catch (error) {
		console.error('Error saving internet payment record:', error)
		return null
	}
}

// Endpoint antiguo para pagos genéricos
app.post('/payments', async (req, res) => {
	const body = req.body as Partial<PaymentRequest>

	if (
		typeof body.amount !== 'number' ||
		typeof body.description !== 'string' ||
		typeof body.source_id !== 'string' ||
		typeof body.device_session_id !== 'string' ||
		typeof body.customer?.name !== 'string' ||
		typeof body.customer?.last_name !== 'string' ||
		typeof body.customer?.email !== 'string'
	) {
		res.status(400).json({
			error: 'Invalid request body'
		})
		return
	}

	try {
		const charge = await createCharge({
			method: 'card',
			amount: body.amount,
			description: body.description,
			source_id: body.source_id,
			device_session_id: body.device_session_id,
			currency: body.currency || 'MXN',
			order_id: body.order_id,
			customer: {
				name: body.customer.name,
				last_name: body.customer.last_name,
				email: body.customer.email,
				phone_number: body.customer.phone_number
			}
		})

		const chargeObj = charge as any
		res.status(201).json(chargeObj)
	} catch (error) {
		res.status(502).json({
			error: 'Openpay charge failed',
			details: error
		})
	}
})

// Nuevo endpoint para pago de internet con MikroTik
app.post('/internet-payment', async (req, res) => {
	const body = req.body as Partial<InternetPaymentRequest>

	if (
		typeof body.amount !== 'number' ||
		typeof body.plan_id !== 'string' ||
		typeof body.duration !== 'number' ||
		typeof body.source_id !== 'string' ||
		typeof body.device_session_id !== 'string' ||
		typeof body.customer?.name !== 'string' ||
		typeof body.customer?.last_name !== 'string' ||
		typeof body.customer?.email !== 'string'
	) {
		res.status(400).json({
			error: 'Invalid request body'
		})
		return
	}

	try {
		// 1. Procesar pago en OpenPay
		const charge = await createCharge({
			method: 'card',
			amount: body.amount,
			description: `Internet access for ${body.duration} minutes`,
			source_id: body.source_id,
			device_session_id: body.device_session_id,
			currency: body.currency || 'MXN',
			order_id: body.order_id,
			customer: {
				name: body.customer.name,
				last_name: body.customer.last_name,
				email: body.customer.email,
				phone_number: body.customer.phone_number
			}
		})

		const chargeObj = charge as any

		// 2. Si pago es exitoso, crear usuario en MikroTik
		if (chargeObj.status === 'completed') {
			try {
				// Generar credenciales
				const { username, password } = generateCredentials()

				// Crear usuario Hotspot en MikroTik
				const hotspotResult = await createHotspotUser(username, password, body.duration)

				// 3. Guardar registro de compra
				saveInternetPaymentRecord(chargeObj, body.customer, body.amount, { duration: body.duration }, hotspotResult)

				// 4. Retornar credenciales al cliente
				res.status(201).json({
					success: true,
					transaction_id: chargeObj.id,
					credentials: {
						username: hotspotResult.username,
						password: hotspotResult.password,
						expiresAt: hotspotResult.expiresAt
					},
					message: 'Internet access activated successfully'
				})
			} catch (mikroError) {
				console.error('MikroTik error:', mikroError)
				res.status(201).json({
					success: false,
					transaction_id: chargeObj.id,
					error: 'Payment successful but failed to create Hotspot user',
					details: mikroError
				})
			}
		} else {
			res.status(201).json({
				success: false,
				transaction_id: chargeObj.id,
				status: chargeObj.status,
				message: 'Payment not completed'
			})
		}
	} catch (error) {
		res.status(502).json({
			error: 'Payment processing failed',
			details: error
		})
	}
})

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'OK', timestamp: new Date().toISOString() })
})
