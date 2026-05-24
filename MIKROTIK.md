# MikroTik RouterOS - Venta de Internet por Tiempo

## 🎯 Descripción General

Sistema automático para vender internet por tiempo a través de un MikroTik RouterOS con Hotspot. El cliente paga con OpenPay y recibe credenciales de acceso **inmediatamente**.

## 📋 Flujo de Funcionamiento

```
1. Cliente selecciona plan (5, 10 o 15 minutos)
2. Cliente completa datos personales
3. Cliente ingresa datos de tarjeta
4. OpenPay procesa el pago
   ↓ Si es exitoso ↓
5. Backend crea usuario Hotspot en MikroTik automáticamente
6. Se genera credencial única (usuario/contraseña)
7. Cliente recibe credenciales en pantalla
8. Cliente conecta a WiFi y accede con credenciales
9. Acceso se activa por el tiempo comprado
10. Se guarda registro en JSON
```

## 🛠️ Configuración

### Variables de Entorno

**api/.env**
```bash
OPENPAY_MERCHANT_ID=tu_merchant_id
OPENPAY_PRIVATE_API_KEY=tu_clave_privada
OPENPAY_PRODUCTION=false
PORT=3000
```

**web/.env**
```bash
VITE_OPENPAY_MERCHANT_ID=tu_merchant_id
VITE_OPENPAY_PUBLIC_KEY=tu_clave_publica
VITE_OPENPAY_PRODUCTION=false
VITE_API_URL=http://localhost:3000
```

### MikroTik Configuration

En el backend, la configuración de MikroTik está hardcodeada en `api/src/server.ts`:

```typescript
const MIKROTIK_CONFIG = {
	host: '192.168.1.77',      // IP del MikroTik
	user: 'admin',              // Usuario admin
	password: 'admin',          // Contraseña admin
	port: 8728                  // Puerto API (default)
}
```

**⚠️ Para producción**, cambiar estos valores en variables de entorno.

### Requisitos en MikroTik

1. **Hotspot debe estar configurado y funcionando**
   - IP > Hotspot > configuración básica
   - Crear un "Server" Hotspot

2. **Habilitar API**
   - IP > Services > API
   - Puerto: 8728 (default)

3. **Usuario administrador**
   - System > Users > Permisos: `full` o mínimo `api, hotspot`

## 💰 Planes y Precios

| Plan | Duración | Precio |
|------|----------|--------|
| Plan 1 | 5 minutos | $10 MXN |
| Plan 2 | 10 minutos | $15 MXN |
| Plan 3 | 15 minutos | $20 MXN |

Configurable en `web/src/components/PayForm.tsx`:

```typescript
const INTERNET_PLANS: InternetPlan[] = [
    { id: 'plan_5m', duration: 5, price: 10, label: '5 Minutos' },
    { id: 'plan_10m', duration: 10, price: 15, label: '10 Minutos' },
    { id: 'plan_15m', duration: 15, price: 20, label: '15 Minutos' }
]
```

## 🔌 Endpoint de Pago

**POST** `/internet-payment`

### Request
```json
{
  "amount": 10,
  "plan_id": "plan_5m",
  "duration": 5,
  "source_id": "tok_abc123",
  "device_session_id": "device_xyz789",
  "currency": "MXN",
  "order_id": "INTERNET-123456789",
  "customer": {
    "name": "Juan",
    "last_name": "Pérez García",
    "email": "juan@ejemplo.com",
    "phone_number": "5551234567"
  }
}
```

### Response (Exitoso)
```json
{
  "success": true,
  "transaction_id": "ch_abc123xyz789",
  "credentials": {
    "username": "GUEST_1715339445123_ABC123",
    "password": "r4nd0mp4ssw0rdG3n3r4t3d",
    "expiresAt": "10/05/2026 15:35:45"
  },
  "message": "Internet access activated successfully"
}
```

## 📁 Estructura de Ficheros

Cada pago exitoso genera un JSON en `api/payments/`:

```json
{
  "transaction_id": "ch_abc123xyz789",
  "status": "completed",
  "amount": 10,
  "currency": "MXN",
  "plan": {
    "duration": 5,
    "unit": "minutes"
  },
  "customer": {
    "name": "Juan",
    "last_name": "Pérez García",
    "email": "juan@ejemplo.com",
    "phone_number": "5551234567"
  },
  "credentials": {
    "username": "GUEST_1715339445123_ABC123",
    "password": "r4nd0mp4ssw0rdG3n3r4t3d",
    "expires_at": "10/05/2026 15:35:45"
  },
  "created_at": "2026-05-10T15:30:45.123Z",
  "openpay_response": {
    "id": "ch_abc123xyz789",
    "status": "completed",
    "amount": 10
  }
}
```

## 🚀 Instalación y Ejecución

### 1. Instalar dependencias

```bash
# Backend
cd api
npm install

# Frontend
cd ../web
npm install
```

### 2. Configurar variables de entorno

```bash
# Crear archivos .env con credenciales
cp api/.env.example api/.env
cp web/.env.example web/.env

# Editar y completar valores
```

### 3. Iniciar servidores

```bash
# Terminal 1 - Backend
cd api
npm run dev

# Terminal 2 - Frontend
cd web
npm run dev
```

### 4. Acceder

- **Frontend**: http://localhost:5173
- **Health Check**: http://localhost:3000/health

## 🔍 Pruebas

### MikroTik Desconectado

Si el MikroTik no está disponible, el backend responderá:

```json
{
  "success": false,
  "transaction_id": "ch_abc123xyz789",
  "error": "Payment successful but failed to create Hotspot user",
  "details": "Connection error"
}
```

El pago se procesa pero el usuario no recibe credenciales.

### Tarjetas de Prueba (Sandbox OpenPay)

**Pago exitoso:**
- Número: `4111111111111111`
- Mes: `12`
- Año: `25`
- CVV: `123`

**Pago rechazado:**
- Número: `4000000000000002`
- Mes: `12`
- Año: `25`
- CVV: `123`

## 🐛 Troubleshooting

### Error: "MikroTik connection failed"
- Verificar IP: `ping 192.168.1.77`
- Verificar puerto API: `telnet 192.168.1.77 8728`
- Verificar usuario/contraseña
- Verificar que Hotspot esté habilitado

### Error: "OpenPay no está cargado"
- Verificar conexión a internet
- Revisar console del navegador
- Verificar que no haya bloqueador de scripts

### Usuarios no se crean en MikroTik
- Revisar logs del backend
- Verificar permisos de usuario admin
- Revisar configuración de Hotspot

### Credenciales no se muestran al cliente
- Revisar respuesta del servidor en Network tab
- Verificar que `success: true` en respuesta
- Revisar console del navegador

## 📊 Monitoreo

### Comandos útiles en MikroTik

```bash
# Ver usuarios Hotspot activos
/ip/hotspot/user/print

# Ver sesiones activas
/ip/hotspot/active/print

# Ver perfiles
/ip/hotspot/profile/print

# Logs del Hotspot
/system/logging/print
```

## 🔐 Seguridad

- ✅ Credenciales únicas por usuario
- ✅ Pago verificado antes de crear usuario
- ✅ Timeout automático por duración
- ✅ Credenciales encriptadas en tránsito (SSL)
- ⚠️ NO almacenar en BD (solo JSON)

## 🚀 Próximas Mejoras

- [ ] Panel de administración para ver usuarios activos
- [ ] Renovación de acceso sin nuevo pago
- [ ] Notificación por SMS/Email al cliente
- [ ] Webhooks de MikroTik para verificación
- [ ] Refund automático si usuario no se crea
- [ ] Límite de banda por usuario
- [ ] Descuentos por tiempo limitado
- [ ] QR para acceso rápido

## 📞 Soporte

Para problemas o preguntas sobre la integración:
1. Revisar logs: `api/payments/`
2. Revisar console del navegador (F12)
3. Verificar conexión MikroTik
4. Revisar credenciales OpenPay

---

**Versión**: 1.0  
**Última actualización**: Mayo 10, 2026
