# Integración OpenPay - Guía Completa

## Descripción

Esta integración permite procesar pagos a través de OpenPay y guardar automáticamente un fichero JSON con los detalles de cada transacción exitosa.

## Características

✅ Formulario seguro de pago con OpenPay  
✅ Tokenización de tarjetas  
✅ Validación en cliente y servidor  
✅ Guardado automático de comprobantes en JSON  
✅ Respuestas de pago en tiempo real  

## Estructura de Ficheros de Pago

Cuando un pago es exitoso, se crea un fichero JSON en la carpeta `api/payments/` con la siguiente estructura:

```json
{
  "transaction_id": "ch_123456789",
  "status": "completed",
  "amount": 100.00,
  "currency": "MXN",
  "customer": {
    "name": "Juan",
    "last_name": "Pérez García",
    "email": "juan@ejemplo.com",
    "phone_number": "5551234567"
  },
  "created_at": "2024-05-10T15:30:45.123Z",
  "openpay_response": {
    "id": "ch_123456789",
    "status": "completed",
    "amount": 100.00
  }
}
```

## Configuración

### 1. Backend (Node.js + Express)

Variables de entorno en `api/.env`:

```
OPENPAY_MERCHANT_ID=tu_id_comerciante
OPENPAY_PRIVATE_API_KEY=tu_clave_privada
OPENPAY_PRODUCTION=false  # Cambiar a true en producción
PORT=3000
```

### 2. Frontend (React + Vite)

Variables de entorno en `web/.env`:

```
VITE_OPENPAY_MERCHANT_ID=tu_id_comerciante
VITE_OPENPAY_PUBLIC_KEY=tu_clave_publica
VITE_OPENPAY_PRODUCTION=false  # Cambiar a true en producción
VITE_API_URL=http://localhost:3000
```

## Flujo de Pago

```
1. Usuario completa formulario de cliente (nombre, email, teléfono, monto)
2. Usuario ingresa datos de tarjeta
3. Frontend crea token con OpenPay.token.create()
4. Token se envía al backend
5. Backend procesa el pago con Openpay.charges.create()
6. Si es exitoso (status: completed):
   - Se guarda fichero JSON en api/payments/
   - Se retorna confirmación al cliente
7. Frontend muestra mensaje de éxito
```

## Instalación

### Backend

```bash
cd api
npm install openpay
npm install  # Si no lo has hecho
```

### Frontend

```bash
cd web
npm install axios  # Ya lo tienen instalado
npm install
```

## Uso

### Iniciar Backend

```bash
cd api
npm run dev
# O si usas TypeScript
npx ts-node src/server.ts
```

### Iniciar Frontend

```bash
cd web
npm run dev
```

## Cambios Implementados

### `web/src/components/PayForm.tsx`
- ✅ Integración completa con OpenPay
- ✅ Captura de datos del cliente
- ✅ Generación de token de tarjeta
- ✅ Envío de pago al backend
- ✅ Manejo de errores y mensajes
- ✅ Estados de carga

### `api/src/server.ts`
- ✅ Endpoint POST `/payments` completo
- ✅ Guardado automático de ficheros JSON
- ✅ Validación de datos
- ✅ Manejo de errores de OpenPay
- ✅ Carpeta `api/payments/` auto-creada

## Datos de Prueba (Sandbox)

Para probar en modo sandbox, usa:

**Tarjeta exitosa:**
- Número: 4111111111111111
- Mes: 12
- Año: 25
- CVV: 123

**Tarjeta rechazada:**
- Número: 4000000000000002
- Mes: 12
- Año: 25
- CVV: 123

## Respuesta Exitosa del Backend

```json
{
  "id": "ch_123456789",
  "status": "completed",
  "amount": 100.00,
  "currency": "MXN",
  "payment_file": "payment_ch_123456789_1715339445123.json",
  "success": true,
  "...": "otros datos de OpenPay"
}
```

## Carpeta de Pagos

Todos los ficheros se guardan en: `api/payments/`

Ejemplo de ficheros:
```
payment_ch_abc123_1715339445123.json
payment_ch_def456_1715339450456.json
payment_ch_ghi789_1715339455789.json
```

## Troubleshooting

### Error: "OPENPAY_MERCHANT_ID no está definido"
- Verifica que exista `api/.env` con las credenciales correctas

### Error: "OpenPay no está cargado"
- Verifica que tengas conexión a internet (los scripts se cargan desde CDN)
- Revisa la consola del navegador para más detalles

### Ficheros no se guardan
- Verifica que `api/payments/` existe (se crea automáticamente)
- Revisa permisos de escritura en el servidor

## Próximas Mejoras

- [ ] Guardar ficheros en PDF
- [ ] Enviar comprobante por email
- [ ] Sistema de reintentos de pago
- [ ] Webhooks de OpenPay
- [ ] Dashboard de transacciones
- [ ] Validación de CVV en el frontend

