# 🌐 MikroTik Internet Sales - OpenPay Integration

Sistema automático para vender acceso a internet por tiempo, integrando pagos con OpenPay y control de usuarios en MikroTik RouterOS Hotspot.

## 🎯 Características

- ✅ **Pagos instantáneos** con OpenPay
- ✅ **Creación automática** de usuarios Hotspot en MikroTik
- ✅ **Credenciales únicas** para cada cliente
- ✅ **Planes configurables** (5, 10, 15 minutos)
- ✅ **Acceso inmediato** sin intervención manual
- ✅ **Registro de transacciones** en JSON
- ✅ **Interface moderna** con React + Tailwind
- ✅ **TypeScript** para seguridad de tipos

## 🏗️ Stack Tecnológico

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **OpenPay JS** - Payment processing

### Backend
- **Node.js + Express** - API REST
- **TypeScript** - Type safety
- **Openpay SDK** - Payment processing
- **node-routeros** - MikroTik API client
- **File System** - JSON storage

### Infrastructure
- **MikroTik RouterOS** - Internet gateway & Hotspot
- **OpenPay** - Payment processor

## 📋 Requisitos

- Node.js 16+
- npm o yarn
- MikroTik RouterOS con Hotspot configurado
- Cuenta OpenPay (https://www.openpay.mx/)
- Internet connectivity

## ⚙️ Configuración

### 1. Clonar repositorio
```bash
git clone <repo>
cd test-openpay-mikrotik
```

### 2. Variables de entorno

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
VITE_MIKROTIK_LOGIN_URL=http://internet.online/login
```

### 3. Instalar dependencias
```bash
# Backend
cd api
npm install

# Frontend
cd ../web
npm install
```

## 🚀 Ejecución

```bash
# Terminal 1 - Backend (Puerto 3000)
cd api
npm run dev

# Terminal 2 - Frontend (Puerto 5173)
cd web
npm run dev
```

Luego abre: **http://localhost:5173**

## 💰 Planes Disponibles

| Plan | Duración | Precio |
|------|----------|--------|
| Plan 1 | 5 minutos | $10 MXN |
| Plan 2 | 10 minutos | $15 MXN |
| Plan 3 | 15 minutos | $20 MXN |

## 🔄 Flujo de Compra

```
Cliente selecciona plan
        ↓
Ingresa datos personales
        ↓
Ingresa datos de tarjeta
        ↓
OpenPay procesa pago
        ↓
Pago exitoso?
        ├─ SÍ → MikroTik crea usuario Hotspot
        │       ↓
        │       Genera credenciales
        │       ↓
        │       Cliente recibe usuario/contraseña
        │       ↓
        │       Registra transacción en JSON
        │
        └─ NO → Muestra error
```

## 📁 Estructura del Proyecto

```
test-openpay-mikrotik/
├── api/
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── server.ts          # API endpoints & MikroTik logic
│   │   └── common/
│   │       └── dotenv.ts      # Environment config
│   ├── package.json
│   ├── .env                   # (Crear manualmente)
│   └── .env.example
│
├── web/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   └── PayForm.tsx    # Payment UI component
│   │   └── types/
│   │       └── openpay.d.ts   # OpenPay types
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env                   # (Crear manualmente)
│   └── .env.example
│
├── payments/                  # Registros de transacciones (auto-creado)
│   └── internet_*.json
│
├── INTEGRATION.md             # Documentación de pagos
├── MIKROTIK.md               # Documentación de MikroTik
└── README.md                 # Este archivo
```

## 🔌 API Endpoints

### POST `/internet-payment`
Procesa pago y crea usuario Hotspot

**Request:**
```json
{
  "amount": 10,
  "plan_id": "plan_5m",
  "duration": 5,
  "source_id": "tok_xyz",
  "device_session_id": "device_xyz",
  "currency": "MXN",
  "order_id": "ORDER-123",
  "customer": {
    "name": "Juan",
    "last_name": "Pérez",
    "email": "juan@mail.com",
    "phone_number": "5551234567"
  }
}
```

**Response exitoso:**
```json
{
  "success": true,
  "transaction_id": "ch_abc123",
  "credentials": {
    "username": "GUEST_1715339445123_ABC123",
    "password": "r4nd0mp4ssw0rd",
    "expiresAt": "10/05/2026 15:35:45"
  }
}
```

### GET `/health`
Verifica estado del servidor

## 📊 Registro de Transacciones

Cada compra exitosa genera un JSON en `api/payments/`:

```json
{
  "transaction_id": "ch_abc123",
  "status": "completed",
  "amount": 10,
  "currency": "MXN",
  "plan": { "duration": 5, "unit": "minutes" },
  "customer": { "name": "Juan", "email": "juan@mail.com" },
  "credentials": { "username": "GUEST_...", "password": "..." },
  "created_at": "2026-05-10T15:30:45.123Z"
}
```

## 🔐 Seguridad

- ✅ Credenciales únicas por usuario
- ✅ Pago verificado antes de crear usuario
- ✅ Timeout automático por duración
- ✅ SSL/TLS en tránsito (OpenPay)
- ⚠️ NO almacenar credenciales en base de datos

## 🧪 Pruebas

### Tarjetas de Prueba (Sandbox)

**Exitosa:**
```
4111 1111 1111 1111
Mes: 12 | Año: 25 | CVV: 123
```

**Rechazada:**
```
4000 0000 0000 0002
Mes: 12 | Año: 25 | CVV: 123
```

### Verificar MikroTik

```bash
# Ping
ping 192.168.1.77

# API connectivity
telnet 192.168.1.77 8728
```

## 🐛 Troubleshooting

### "MikroTik connection failed"
- Verificar IP y puertos
- Verificar usuario/contraseña
- Verificar que API esté habilitada
- Revisar firewall

### "OpenPay error"
- Verificar credenciales
- Verificar modo sandbox/producción
- Revisar console del navegador

### Usuarios no se crean
- Revisar logs del backend
- Verificar permisos de usuario admin
- Verificar Hotspot configurado

## 📚 Documentación Adicional

- [MIKROTIK.md](./MIKROTIK.md) - Guía completa de integración MikroTik
- [INTEGRATION.md](./INTEGRATION.md) - Detalles del sistema de pagos

## 🚀 Deployment

### Producción

1. Cambiar `OPENPAY_PRODUCTION=true`
2. Usar credenciales de producción
3. Cambiar IP/puertos de MikroTik según red
4. Usar HTTPS/SSL en frontend
5. Implementar base de datos para auditoría

## 📝 Scripts

```bash
# Setup automático (Linux/Mac)
chmod +x setup.sh
./setup.sh

# Verificar instalación
npm run health
```

## 📞 Soporte

1. Revisar documentación en MIKROTIK.md
2. Verificar logs del servidor
3. Revisar console del navegador (F12)
4. Verificar conectividad de red

## 📄 Licencia

MIT

## ✅ Checklist Pre-Producción

- [ ] Configurar credenciales OpenPay
- [ ] Configurar IP y credenciales MikroTik
- [ ] Habilitar HTTPS/SSL
- [ ] Configurar logs y monitoring
- [ ] Realizar pruebas end-to-end
- [ ] Backup de base de datos
- [ ] Documentar soporte
- [ ] Capacitar equipo

---

**Versión:** 1.0  
**Última actualización:** Mayo 10, 2026  
**Autor:** AI Assistant
