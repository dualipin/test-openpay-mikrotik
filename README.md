# Makrowisp

Sistema automático para vender acceso a internet por tiempo, integrando pagos con con tarjeta y control de usuarios en MikroTik RouterOS Hotspot.

Aquí tienes el resumen arquitectónico y operativo completo de tu SaaS para ISPs (estilo WispHub). Esta es una radiografía técnica detallada de todo lo que hemos estructurado, integrando tu última regla sobre la segmentación de planes.

### 1. Stack Tecnológico y Base de Datos

El sistema manejará concurrencia y eventos de red.

* **Backend:** NestJS (encargado de la lógica de negocio, CRON jobs para expiraciones, webhooks de pagos y comunicación con MikroTik vía RouterOS API en el puerto 8728).
* **Frontend:** Vercel (aplicación moderna e independiente para el portal cautivo y pasarelas de pago).
* **Base de Datos:** Prisma ORM. Se recomienda migrar el `provider = "sqlite"` a `postgresql` para soportar la concurrencia multi-tenant en producción.

### 2. Gestión de Planes y Perfiles

* **Segmentación Estricta:** Los planes son diferentes y están divididos por tipo (`AccessType`: Hotspot, PPPoE, etc.) y pueden variar por caso o router. Tu modelo `Plan` y `Profile` en Prisma gestionarán las velocidades de subida/bajada (`uploadSpeed`, `downloadSpeed`).
* **Aplicación en MikroTik:** NestJS traducirá estos planes creando *User Profiles* (para Hotspot) o *PPPoE Profiles / Simple Queues* (para clientes residenciales).

---

### 3. Flujo 1: Clientes de Hotspot (Portal Cautivo Móvil)

El objetivo aquí es la **cero fricción** con aprovisionamiento 100% automático.

1. **Conexión:** El usuario anónimo se conecta a la red Wi-Fi abierta.
2. **Redirección:** MikroTik intercepta el tráfico y lanza el portal cautivo alojado en Vercel, enviando la MAC del dispositivo en la URL.
3. **Selección y Pago:** El usuario ve los planes de tiempo específicos para Hotspot en esa zona, elige uno y paga (ej. Stripe, MercadoPago, OpenPay).
4. **Auto-Login (Magia NestJS):** Al confirmarse el pago, NestJS se conecta a la API de MikroTik, crea el usuario y contraseña en `/ip hotspot user`, e inmediatamente ejecuta el comando `/ip hotspot active login` con la MAC.
5. **Resultado:** El usuario obtiene internet instantáneamente sin tener que teclear credenciales.

---

### 4. Flujo 2: Clientes Residenciales (Fibra / Antena)

El objetivo aquí es **cero intervención post-instalación** y evitar romper dispositivos "tontos" (Smart TVs, IoT) con portales cautivos innecesarios.

#### A. La Instalación (Día 1)

1. El instalador llega a la casa, coloca el router (Tenda, TP-Link, etc.) y lo configura por PPPoE o IP estática.
2. Desde la App de Administración, el instalador registra al cliente (`Customer`) y liga el servicio a ese router. NestJS aprovisiona el MikroTik.
3. Toda la casa tiene internet al instante. El instalador deja un sticker/código QR físico en el router del cliente con la URL permanente: `tu-saas.com/pagos`.

#### B. La Suspensión y el "Puente HTML"

Cuando el tiempo pagado expira, se ejecuta el flujo de renovación automática sin intervención humana:

1. **Corte Lógico:** Un CRON job en NestJS detecta que el servicio expiró. Se conecta a MikroTik y manda la IP/Usuario PPPoE a un `Address List` de "morosos" (suspendidos), restringiendo su velocidad/acceso.
2. **El Trampolín (Walled Garden):** MikroTik intercepta cualquier intento de navegación de este usuario suspendido y lo manda a un archivo `login.html` alojado localmente en el propio MikroTik.
3. **Redirección Inyectada:** Ese archivo HTML superligero redirige automáticamente al cliente hacia tu frontend en la nube, inyectando sus datos: `https://tu-portal-cautivo.vercel.app/renovar?ip=$(ip)&mac=$(mac)`.

#### C. La Autogestión y Renovación en Vercel

1. **Identificación:** Vercel recibe la IP/MAC de la URL, consulta a NestJS y reconoce exactamente quién es el cliente residencial.
2. **Libertad de Elección:** Vercel le muestra al cliente su estado de suspensión y le despliega los planes residenciales disponibles para su nodo. El cliente es **libre de elegir**: renovar su plan actual de 50M, hacer un *upgrade* a 100M, o comprar un paquete de emergencia por menos tiempo.
3. **Restauración Inmediata:** El cliente paga. NestJS procesa la orden, actualiza el `planId` en Prisma, ajusta la *Simple Queue* o *Profile* en MikroTik según lo que compró, y lo saca del `Address List` de morosos. Toda su casa (incluyendo Smart TVs) recupera el internet al instante.