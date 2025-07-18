# 📊 UpnifIA - Conector IA para Upnify CRM (GPT + Claude MCP)

Este proyecto conecta **Upnify CRM** con **Inteligencia Artificial** de dos formas complementarias:

<**Claude Agents** y futuros asistentes usando MCP (Model Context Protocol)

---

## 🎯 ¿Para qué sirve?

**UpnifIA** permite que los asistentes de IA puedan:

- 👤 **Crear prospectos** automáticamente desde conversaciones
- 📊 **Consultar reportes de ventas** en tiempo real
- 📈 **Obtener estadísticas** de prospectos diarios
- 💬 **Generar mensajes personalizados** para clientes

**Casos de uso reales:**

- "*Oye ChatGPT, crea un prospecto para María González de Tech Solutions, correo maria@tech.com*"
- "*Claude, ¿cuántas ventas tuvimos este mes agrupadas por ejecutivo?*"
- "*Dame un resumen de los prospectos registrados hoy*"

---

## 📁 Estructura del proyecto

```
UpnifIA/
│
├── gpt/
│   ├── server-gpt.js              # API REST completa para ChatGPT
│   └── openapi.yaml               # Documentación OpenAPI para GPT Actions
│
├── mcp/
│   ├── server-mcp.js              # Servidor JSON-RPC para Claude MCP
│   └── manifest.json              # Manifiesto MCP para Claude/Android Auto
│
├── package.json                   # Dependencias del proyecto
├── Procfile                       # Para despliegue en Railway/Heroku
└── README.md                      # Esta guía completa
```

---

## 🚀 Integración GPT (OpenAPI REST) - ChatGPT Actions

### ¿Cuándo usar esta integración?

- ✅ **Demos rápidas** con ChatGPT Plus
- ✅ **Prototipos** para mostrar funcionalidad
- ✅ **Uso personal** o equipos pequeños
- ✅ **Presentaciones** comerciales

### 🛠️ Configuración paso a paso:

#### 1. Preparar el servidor GPT

```bash
# Navegar a la carpeta GPT
cd gpt

# Instalar dependencias
npm install express

# Configurar tu token de Upnify en server-gpt.js
# Busca: const tkSesion = 'TU_TOKEN_AQUI'

# Iniciar servidor
node server-gpt.js
```

✅ **Servidor corriendo en:** `http://localhost:3001`

#### 2. Crear GPT personalizado

1. Ve a: https://chat.openai.com/create
2. **Configura GPT:**

   - **Nombre:** "Upnify Assistant"
   - **Descripción:** "Asistente para gestionar prospectos y ventas en Upnify CRM"
   - **Instrucciones:**
     ```
     Eres un asistente especializado en Upnify CRM. Puedes:
     - Crear prospectos con nombre, apellidos y correo
     - Consultar reportes de ventas con diferentes filtros
     - Obtener estadísticas de prospectos

     Siempre confirma los datos antes de crear prospectos.
     Presenta los reportes de manera clara y visual.
     ```
3. **Activar "Actions":**

   - Clic en "Create new action"
   - Sube el archivo `openapi.yaml`
   - **¡Listo!** ChatGPT ya puede usar tu API

#### 3. Ejemplos de uso con ChatGPT

```
� "Crea un prospecto para Laura Díaz de Upnify, correo laura@upnify.com"

💬 "¿Cuántos prospectos se registraron hoy?"

💬 "Dame un resumen de ventas mensuales por ejecutivo del 2025"

💬 "Consulta las ventas semanales de este año sin impuestos"
```

### 🔧 Funcionalidades disponibles:

- **POST /crear-prospecto** - Crear nuevos prospectos
- **GET /consultar-reportes** - Reportes de ventas con múltiples filtros
- **GET /openapi.yaml** - Documentación automática

---

## 🟣 Integración Claude MCP (Model Context Protocol)

### ¿Cuándo usar esta integración?

- ✅ **Aplicaciones empresariales** a gran escala
- ✅ **Integraciones futuras** con Claude for Work
- ✅ **Android Auto** y asistentes de voz
- ✅ **Sistemas distribuidos** y microservicios

### 🛠️ Configuración paso a paso:

#### 1. Preparar el servidor MCP

```bash
# Navegar a la carpeta MCP
cd mcp

# Instalar dependencias
npm install express

# Configurar tu token de Upnify en server-mcp.js
# Busca: const tkSesion = 'TU_TOKEN_AQUI'

# Iniciar servidor JSON-RPC
node server-mcp.js
```

✅ **Servidor corriendo en:** `http://localhost:3000`

#### 2. Conectar con Claude/Asistentes

- **Claude Desktop:** Detecta automáticamente el `manifest.json` vía `/get_manifest`
- **Android Auto:** Compatible con el protocolo MCP estándar
- **Otros asistentes:** Cualquier cliente que soporte MCP

#### 3. Recursos disponibles:

- **📊 prospectos_diarios** - Lista de prospectos de hoy
- **📈 ventas_mensuales** - Resumen de ventas del mes actual

#### 4. Herramientas disponibles:

- **👤 crear_prospecto** - Crear nuevos registros
- **💬 mensaje_cliente_casual** - Generar saludos personalizados

---

## 🌐 Despliegue en producción

### Railway (Recomendado)

```bash
# 1. Conectar repositorio a Railway
# 2. Railway detecta automáticamente el Procfile
# 3. Configurar variable de entorno: UPNIFY_TOKEN
# 4. ¡Deploy automático!
```

### Heroku

```bash
git push heroku main
heroku config:set UPNIFY_TOKEN=tu_token_aqui
```

### Render/Vercel

- Subir repositorio
- Configurar build command: `npm install`
- Start command: `npm start`

---

## 📊 Comparativa de integraciones

| Característica              | GPT + OpenAPI           | Claude + MCP               |
| ---------------------------- | ----------------------- | -------------------------- |
| **Facilidad de setup** | ⭐⭐⭐⭐⭐              | ⭐⭐⭐⭐                   |
| **Escalabilidad**      | ⭐⭐⭐                  | ⭐⭐⭐⭐⭐                 |
| **Casos de uso**       | Demos, prototipos       | Producción, empresa       |
| **Compatibilidad**     | ChatGPT Plus            | Claude, futuros asistentes |
| **Mantenimiento**      | Bajo                    | Medio                      |
| **Costo**              | ChatGPT Plus (~$20/mes) | Según uso de Claude       |

---

## 🔑 Configuración de tokens

### Obtener token de Upnify:

1. Entra a tu cuenta de Upnify
2. Ve a **Configuración → API**
3. Copia tu **Token de sesión**
4. Pégalo en el archivo correspondiente:
   - `gpt/server-gpt.js` → línea con `tkSesion`
   - `mcp/server-mcp.js` → línea con `tkSesion`

---

## 🚨 Solución de problemas comunes

### Error: "Cannot find module 'express'"

```bash
npm install express
```

### Error: "Sesión inválida" de Upnify

- Verifica que tu token esté correcto
- Revisa que no haya expirado
- Genera un nuevo token si es necesario

### GPT no detecta las actions

- Asegúrate que el servidor esté corriendo
- Verifica que el archivo `openapi.yaml` sea válido
- Revisa que la URL en ChatGPT sea correcta

### Claude no conecta con MCP

- Confirma que el puerto 3000 esté libre
- Verifica que el `manifest.json` sea válido
- Revisa los logs del servidor para errores

---

## 💡 Ejemplos de uso avanzado

### Crear múltiples prospectos desde Excel

```javascript
// Script para procesar CSV y crear prospectos masivamente
const prospectos = [
  {nombre: "Juan", apellidos: "Pérez", correo: "juan@empresa.com"},
  {nombre: "María", apellidos: "González", correo: "maria@tech.com"}
];

// ChatGPT puede procesar esto automáticamente
```

### Dashboard de ventas en tiempo real

```javascript
// Claude puede generar reportes automáticos cada hora
"Dame las ventas de hoy vs ayer, agrupadas por región"
```

### Integración con WhatsApp/Telegram

```javascript
// Los servidores pueden recibir webhooks de bots
// Para crear prospectos desde conversaciones
```

---

## 🛡️ Seguridad y mejores prácticas

### Para producción:

- ✅ Usar variables de entorno para tokens
- ✅ Implementar rate limiting
- ✅ Agregar validación de entrada
- ✅ Logs de auditoría
- ✅ HTTPS obligatorio

### Variables de entorno recomendadas:

```bash
UPNIFY_TOKEN=tu_token_aqui
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📞 Soporte

- **Issues:** [GitHub Issues](https://github.com/adrielisa/UpnifIA/issues)
- **Documentación Upnify:** [API Docs](https://developers.upnify.com)
- **MCP Protocol:** [Model Context Protocol](https://modelcontextprotocol.io)

---

## 📄 Licencia

ISC - Libre para uso comercial y personal.

---

**🎉 ¡UpnifIA está listo para conectar tu CRM con el futuro de la IA!**
