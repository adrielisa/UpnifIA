# UpnifIA

API para crear prospectos en Upnify CRM con conexión para IA.

## Descripción

UpnifIA es una API REST que permite crear prospectos en Upnify CRM con documentación OpenAPI compatible con sistemas de IA como ChatGPT.

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/adrielisa/UpnifIA.git

# Navegar al directorio
cd UpnifIA

# Instalar dependencias
npm install

# Ejecutar el servidor
npm start
```

## Uso

### Endpoints disponibles:

- `POST /crear-prospecto` - Crear un nuevo prospecto
- `GET /openapi.yaml` - Documentación OpenAPI para IA
- `GET /` - Información de la API

### Ejemplo de solicitud:

```bash
curl -X POST http://localhost:3000/crear-prospecto \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellidos": "Pérez",
    "correo": "juan@ejemplo.com",
    "telefono2": "5551234567",
    "empresa": "Tech Solutions",
    "puesto": "Gerente de IT"
  }'
```

### Respuesta exitosa:

```json
{
  "success": true,
  "message": "Prospecto creado exitosamente",
  "data": {
    // Datos del prospecto creado
  }
}
```

## Configuración

El token de sesión de Upnify está configurado en el archivo `index.js`. Para uso en producción, se recomienda usar variables de entorno.

## Conexión con IA

La API incluye documentación OpenAPI en `/openapi.yaml` que permite a sistemas de IA como ChatGPT entender y usar la API automáticamente.

## Tecnologías

- Node.js
- Express.js
- HTTPS nativo de Node.js
- OpenAPI 3.1.0

## Licencia

ISC
