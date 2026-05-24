# 🔧 Guía de Configuración MikroTik RouterOS

## Requisitos Previos

- MikroTik RouterOS v6.48+ 
- Acceso de administrador
- Interfaz de red para Hotspot

## ✅ Paso 1: Verificar que el API esté Habilitado

1. Abre **Winbox** o accede por SSH
2. Ve a: **IP > Services**
3. Busca `api` en la lista
4. Verifica que esté **habilitado** (botón)
5. Puerto debe ser **8728** (default)

```
[admin@MikroTik] > /ip/service/print
 #  NAME       PORT  CERTIFICATE  VRU
 0  telnet     23    none         
 1  ftp        21    none         
 2  www        80    none         
 3  ssh        22    none         
 4X www-ssl    443   none         
 5  api        8728  none         ← Debe estar ENABLED
 6  winbox     8291  none         
 7  api-ssl    8729  none
```

## ✅ Paso 2: Verificar Acceso Admin

1. Ve a: **System > Users**
2. Selecciona usuario `admin`
3. Verifica que tenga estos permisos:
   - ✓ API access
   - ✓ Hot-spot
   - ✓ Read
   - ✓ Write

```
[admin@MikroTik] > /system/user/print
 #  NAME    GROUP        DISABLED  ADDRESS
 0  admin   full                   0.0.0.0/0  ← Debe estar ENABLED
```

## ✅ Paso 3: Configurar Hotspot

### Interfaz Bridge/VLAN (donde estará el Hotspot)

```
/ip/address/add \
    address=10.0.1.1/24 \
    interface=bridge-local \
    network=10.0.1.0 \
    broadcast=10.0.1.255
```

### Perfil de Hotspot

```
/ip/hotspot/profile/add \
    name=default \
    hotspot-address=10.0.1.1 \
    login-by=cookie,http-chap \
    html-directory=hotspot
```

### Servidor Hotspot

```
/ip/hotspot/server/add \
    name=hs-server-1 \
    interface=bridge-local \
    address-pool=pool-hotspot \
    profile=default
```

### Pool de IPs para Hotspot

```
/ip/pool/add \
    name=pool-hotspot \
    ranges=10.0.1.100-10.0.1.199
```

### NAT para acceso a internet

```
/ip/firewall/nat/add \
    chain=srcnat \
    out-interface=ether1 \
    action=masquerade
```

## ✅ Paso 4: Crear Usuario de Prueba

```
/ip/hotspot/user/add \
    name=test-guest \
    password=test1234 \
    profile=default \
    disabled=no \
    limit-uptime=10m
```

Verificar:
```
/ip/hotspot/user/print
```

## ✅ Paso 5: Prueba Conectividad

### Desde Linux/Mac
```bash
# Verificar que el API está accesible
telnet 192.168.1.77 8728

# Si conecta = OK
# Si no conecta = revisar firewall
```

### Desde el Backend (Node.js)
```javascript
const client = new RosClient({
    host: '192.168.1.77',
    user: 'admin',
    password: 'admin',
    port: 8728
});

client.connect().then(() => {
    console.log('✓ Conectado a MikroTik');
    client.close();
}).catch(err => {
    console.error('✗ Error:', err);
});
```

## 🔄 Flujo Automático

Cuando un cliente compra, el backend hace esto automáticamente:

1. **Conecta a API REST** del MikroTik
2. **Crea usuario Hotspot** con:
   - Usuario único: `GUEST_timestamp_random`
   - Contraseña: generada aleatoriamente
   - Duración: 5, 10 o 15 minutos
   - Perfil: `default`

```typescript
// Lo que hace el backend
await client.write(
    '/ip/hotspot/user/add',
    [
        '=name=GUEST_1715339445123_ABC123',
        '=password=r4nd0mp4ssw0rd',
        '=profile=default',
        '=disabled=no',
        '=limit-uptime=300'  // 5 minutos en segundos
    ]
);
```

3. **Cliente recibe** credenciales en pantalla
4. **Usuario se conecta** a WiFi del Hotspot
5. **Ingresa credenciales** en portal
6. **Acceso se activa** por tiempo comprado
7. **Usuario se desconecta** automáticamente después del tiempo

## 📊 Monitoreo

Ver usuarios activos:
```
/ip/hotspot/active/print
```

Ver sesiones completadas:
```
/ip/hotspot/host/print
```

Ver logs de Hotspot:
```
/system/logging/print
/system/logging/action/print
```

## 🔐 Configuración de Firewall

Si los pagos no procesan, revisar firewall:

```
# Permitir conexiones API
/ip/firewall/filter/add \
    chain=input \
    dst-port=8728 \
    protocol=tcp \
    action=accept \
    comment="API RouterOS"
```

## 🆘 Diagnóstico

### Verificar API
```
/system/package/print
> routeros  (ver)
> api       (habilitado?)

/ip/service/enable api
/ip/service/disable api
```

### Revisar puertos
```
# Ver puertos en escucha
/ip/service/print

# En Windows CMD:
netstat -an | find ":8728"
```

### Test conexión
```bash
# Linux
curl -k https://admin:admin@192.168.1.77:8729

# PowerShell
Test-NetConnection -ComputerName 192.168.1.77 -Port 8728
```

## ⚠️ Problemas Comunes

### "Connection refused"
- API no está habilitada
- IP incorrecta
- Firewall bloqueando

**Solución:** Habilitar API en IP > Services

### "Authentication failed"
- Usuario/contraseña incorrecto
- Usuario sin permisos de API

**Solución:** Revisar System > Users y permisos

### "Usuarios no se crean"
- Perfil `default` no existe
- Errores de sintaxis en comandos

**Solución:** Crear perfil manualmente o revisar logs

### "Usuario se desconecta antes del tiempo"
- `limit-uptime` no está configurado correctamente
- Reinicio del Hotspot

**Solución:** Verificar `limit-uptime` en segundos (5 min = 300)

## 🎯 Configuración Final Recomendada

```bash
# 1. Crear perfil con límites
/ip/hotspot/profile/add \
    name=limited-profile \
    hotspot-address=10.0.1.1 \
    login-by=http-chap,cookie \
    idle-timeout=10m \
    session-timeout=never \
    traffic-quota=100M \
    rate-limit=2M/2M

# 2. Crear servidor Hotspot
/ip/hotspot/server/add \
    name=main-hotspot \
    interface=ether2 \
    profile=limited-profile

# 3. Crear pool
/ip/pool/add \
    name=hotspot-pool \
    ranges=192.168.89.101-192.168.89.200

# 4. Crear usuario admin para API
/system/user/add \
    name=api-user \
    password=api-secure-pass \
    group=full

# 5. Prueba de usuario temporal
/ip/hotspot/user/add \
    name=temp-guest \
    password=temp1234 \
    disabled=no \
    limit-uptime=5m
```

## 📱 Conexión Cliente

1. Cliente se conecta a WiFi del MikroTik
2. Abre navegador (redirección automática al portal)
3. Ingresa usuario/contraseña recibidas
4. Click en "Login"
5. Acceso concedido por 5, 10 o 15 minutos
6. Countdown visible en portal
7. Desconexión automática después del tiempo

---

**Nota:** Todos estos comandos pueden hacerse en Winbox (GUI) o por SSH/terminal (CLI).

Para más ayuda: https://wiki.mikrotik.com/wiki/Hotspot
