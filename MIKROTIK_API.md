# 📡 Referencia de API MikroTik - Comandos Usados

## Estructura de Comando

```
/path/to/command/operation
[=parameter=value]  ← set parameters
[*ID]               ← item ID (para update/delete)
```

## Comandos Usados por el Backend

### 1. Crear Usuario Hotspot

```
Command: /ip/hotspot/user/add
Parameters:
  =name=GUEST_1715339445123_ABC123      # Usuario único
  =password=r4nd0mp4ssw0rd              # Contraseña
  =profile=default                      # Perfil a usar
  =disabled=no                          # Habilitado
  =limit-uptime=300                     # 5 minutos en segundos

Ejemplo CLI:
/ip/hotspot/user/add name=test password=pass profile=default disabled=no limit-uptime=300

Ejemplo PowerShell (node-routeros):
await client.write('/ip/hotspot/user/add', [
    '=name=GUEST_1715339445123_ABC123',
    '=password=r4nd0mp4ssw0rd',
    '=profile=default',
    '=disabled=no',
    '=limit-uptime=300'
]);
```

### 2. Listar Usuarios Hotspot

```
Command: /ip/hotspot/user/print

Response:
 #  NAME          PASSWORD  PROFILE  DISABLED  LIMIT-UPTIME
 0  GUEST_1715... xyz       default  no        5m
 1  admin         pass      default  no        (unlimited)

Ejemplo CLI:
/ip/hotspot/user/print

Ejemplo PowerShell:
const users = await client.write('/ip/hotspot/user/print', []);
users.forEach(user => {
    console.log(`${user[".id"]} ${user.name} ${user.profile}`);
});
```

### 3. Obtener Sesiones Activas

```
Command: /ip/hotspot/active/print

Response:
 #   NAME        ADDRESS           UPTIME
 0   GUEST_1715  10.0.1.102        2m15s
 1   admin       10.0.1.105        1h20m

Ejemplo CLI:
/ip/hotspot/active/print

Ejemplo PowerShell:
const active = await client.write('/ip/hotspot/active/print', []);
console.log(`${active.length} usuarios activos`);
```

### 4. Habilitar/Deshabilitar Usuario

```
Command: /ip/hotspot/user/set
Parameters:
  *ID=*0                    # ID del usuario
  =disabled=yes             # Deshabilitar
  OR
  =disabled=no              # Habilitar

Ejemplo CLI:
/ip/hotspot/user/set *0 disabled=yes

Ejemplo PowerShell:
await client.write('/ip/hotspot/user/set', ['*0', '=disabled=yes']);
```

### 5. Eliminar Usuario

```
Command: /ip/hotspot/user/remove
Parameters:
  *ID=*0                    # ID del usuario a eliminar

Ejemplo CLI:
/ip/hotspot/user/remove *0

Ejemplo PowerShell:
await client.write('/ip/hotspot/user/remove', ['*0']);
```

### 6. Ver Perfiles Disponibles

```
Command: /ip/hotspot/profile/print

Response:
 #  NAME           LOGIN-BY              IDLE-TIMEOUT
 0  default        cookie,http-chap      15m
 1  limited        http-chap             5m

Ejemplo CLI:
/ip/hotspot/profile/print

Ejemplo PowerShell:
const profiles = await client.write('/ip/hotspot/profile/print', []);
```

## Parámetros Disponibles para Usuario Hotspot

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| name | string | Nombre de usuario | GUEST_1715... |
| password | string | Contraseña | pass1234 |
| profile | string | Perfil a usar | default |
| disabled | yes\|no | Habilitar/deshabilitar | no |
| limit-uptime | time | Duración máxima | 5m, 10m, 1h |
| limit-bytes-total | bytes | Límite de datos | 100M, 1G |
| limit-bytes-down | bytes | Límite descarga | 50M |
| limit-bytes-up | bytes | Límite subida | 50M |
| comment | string | Comentario | Payment ID: ch_abc |
| email | string | Email usuario | user@mail.com |

## Ejemplo Completo en Node.js

```typescript
import { RosClient } from 'node-routeros';

async function createInternetUser(
    duration: number,  // minutos
    username: string,
    password: string
) {
    const client = new RosClient({
        host: '192.168.1.77',
        user: 'admin',
        password: 'admin',
        port: 8728
    });

    try {
        await client.connect();
        console.log('✓ Conectado a MikroTik');

        // Crear usuario
        const result = await client.write(
            '/ip/hotspot/user/add',
            [
                `=name=${username}`,
                `=password=${password}`,
                `=profile=default`,
                `=disabled=no`,
                `=limit-uptime=${duration * 60}`, // convertir a segundos
                `=comment=Auto-generated user`
            ]
        );

        console.log('✓ Usuario creado:', username);

        // Listar usuarios para verificar
        const users = await client.write('/ip/hotspot/user/print', []);
        console.log(`Total usuarios: ${users.length}`);

        // Cerrar conexión
        client.close();
        return result;
    } catch (error) {
        console.error('✗ Error:', error);
        throw error;
    }
}

// Uso
createInternetUser(
    5,
    'GUEST_1715339445123_ABC123',
    'r4nd0mp4ssw0rd'
);
```

## Queries y Filters

```
# Buscar usuario específico
/ip/hotspot/user/print where name~GUEST

# Listar solo usuarios habilitados
/ip/hotspot/user/print where disabled=no

# Listar usuarios con límite de tiempo
/ip/hotspot/user/print where limit-uptime>0

# Buscar por comentario
/ip/hotspot/user/print where comment~payment
```

## Monitoreo y Debugging

```
# Ver logs del Hotspot
/system/logging/print
/system/logging/action/print

# Estadísticas de interfaz
/interface/print stats

# Ver conexiones activas
/ip/hotspot/active/print

# Ver hosts conectados (histórico)
/ip/hotspot/host/print
```

## Mantenimiento

```
# Limpiar usuarios inactivos (más de 1 día)
/ip/hotspot/user/remove [find comment~expired]

# Deshabilitar todos los usuarios
/ip/hotspot/user/set [find] disabled=yes

# Habilitar todos los usuarios
/ip/hotspot/user/set [find] disabled=no

# Resetear password a todos
/ip/hotspot/user/set [find] password=newpass123
```

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `no such command` | Ruta incorrecta | Verificar sintaxis |
| `failure: authentication failed` | User/pass incorrecto | Revisar credenciales |
| `failure: invalid argument` | Parámetro inválido | Revisar nombres de parámetros |
| `failure: item not found` | Usuario no existe | Verificar que usuario existe |
| `already have such` | Usuario duplicado | Usar nombres únicos |
| `permission denied` | Sin permisos | Revisar permisos del usuario API |

## Testing con cURL (API REST)

```bash
# Conectar a API REST de MikroTik
curl -k --user admin:admin \
  'https://192.168.1.77:8729/rest/ip/hotspot/user/print'

# Crear usuario (formato JSON)
curl -k -X POST --user admin:admin \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "test-user",
    "password": "test1234",
    "profile": "default"
  }' \
  'https://192.168.1.77:8729/rest/ip/hotspot/user/add'
```

## Referencia Oficial

- Docs: https://wiki.mikrotik.com/wiki/API
- Hotspot: https://wiki.mikrotik.com/wiki/Hotspot
- User Management: https://wiki.mikrotik.com/wiki/Manual:System/Users

---

**Nota:** Los comandos exactos que usa el backend están en `api/src/server.ts` en la función `createHotspotUser()`.
