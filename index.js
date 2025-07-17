const express = require('express');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Configuration
const tkSesion = 'P07N0RFQjQ0QkQtQzY5Ny00MTQwLUJBQzEtRjhEMDY0RTA2NDRB';
const apiUrl = 'https://api.upnify.com/v4/prospectos';

// OpenAPI Spec para conexión IA
const openAPISpec = `
openapi: 3.1.0
info:
  title: UpnifIA - API para crear prospectos en Upnify
  version: 1.0.0
  description: API para crear prospectos en Upnify CRM
servers:
  - url: https://upnifia-production.up.railway.app
paths:
  /crear-prospecto:
    post:
      summary: Crear un nuevo prospecto en Upnify
      operationId: crearProspecto
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - nombre
                - apellidos
                - correo
              properties:
                nombre:
                  type: string
                  description: Nombre del prospecto (OBLIGATORIO)
                  example: "Adriel"
                  minLength: 1
                apellidos:
                  type: string
                  description: Apellidos del prospecto (OBLIGATORIO)
                  example: "Rodriguez"
                  minLength: 1
                correo:
                  type: string
                  description: Correo electrónico del prospecto (OBLIGATORIO)
                  format: email
                  example: "adriel4@gmail.com"
                telefono2:
                  type: string
                  description: Número de teléfono (OPCIONAL)
                  example: "5551234567"
                movil:
                  type: string
                  description: Número de móvil (OPCIONAL)
                  example: "5551234567"
                empresa:
                  type: string
                  description: Empresa del prospecto (OPCIONAL)
                  example: "Tech Solutions"
                puesto:
                  type: string
                  description: Puesto del prospecto (OPCIONAL)
                  example: "Gerente de IT"
                calle:
                  type: string
                  description: Dirección del prospecto (OPCIONAL)
                  example: "Av. Principal 123"
                ciudad:
                  type: string
                  description: Ciudad del prospecto (OPCIONAL)
                  example: "Ciudad de México"
                idEstado:
                  type: string
                  description: Estado del prospecto (OPCIONAL - usar códigos como CDMX, QROO, etc.)
                  example: "CDMX"
                codigoPostal:
                  type: string
                  description: Código postal (OPCIONAL)
                  example: "01000"
                  pattern: "^[0-9]{5}$"
                titulo:
                  type: string
                  description: Título profesional (OPCIONAL)
                  example: "Ing."
                sexo:
                  type: string
                  description: Sexo del prospecto (OPCIONAL - H para Hombre, M para Mujer)
                  example: "H"
                  enum: ["H", "M"]
                url:
                  type: string
                  description: Sitio web personal o de empresa (OPCIONAL)
                  format: uri
                  example: "https://ejemplo.com"
                colonia:
                  type: string
                  description: Colonia o barrio (OPCIONAL)
                  example: "Centro"
                idMunicipio:
                  type: string
                  description: ID del municipio (OPCIONAL)
                  example: "1"
                facebook:
                  type: string
                  description: Perfil de Facebook (OPCIONAL)
                  example: "facebook.com/usuario"
                twitter:
                  type: string
                  description: Perfil de Twitter (OPCIONAL)
                  example: "twitter.com/usuario"
                skype:
                  type: string
                  description: Usuario de Skype (OPCIONAL)
                  example: "usuario.skype"
                linkedIn:
                  type: string
                  description: Perfil de LinkedIn (OPCIONAL)
                  example: "linkedin.com/in/usuario"
                googlePlus:
                  type: string
                  description: Perfil de Google Plus (OPCIONAL)
                  example: "plus.google.com/usuario"
                etiquetas:
                  type: string
                  description: Etiquetas separadas por comas (OPCIONAL)
                  example: "cliente,importante,tecnologia"
      responses:
        '200':
          description: Prospecto creado exitosamente
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  message:
                    type: string
                  data:
                    type: object
        '400':
          description: Error en la solicitud
        '500':
          description: Error del servidor
`;

// Función para hacer request a Upnify
function makeUpnifyRequest(payload) {
    return new Promise((resolve, reject) => {
        // Convertir payload a form-urlencoded
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(payload)) {
            if (typeof value === 'object' && value !== null) {
                // Para objetos anidados como "cp"
                for (const [subKey, subValue] of Object.entries(value)) {
                    formData.append(`${key}.${subKey}`, subValue || '');
                }
            } else {
                formData.append(key, value || '');
            }
        }
        
        const formDataString = formData.toString();
        const url = new URL(apiUrl);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(formDataString),
                'token': tkSesion,
                'User-Agent': 'Node.js/UpnifIA'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonResponse = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonResponse
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(formDataString);
        req.end();
    });
}

// Endpoint para crear prospecto
app.post('/crear-prospecto', async (req, res) => {
    try {
        const {
            nombre = "",
            apellidos = "",
            correo = "",
            telefono2 = "",
            movil = "",
            empresa = "",
            puesto = "",
            calle = "",
            ciudad = "",
            idEstado = "",
            codigoPostal = "",
            titulo = "",
            sexo = "",
            url = "",
            colonia = "",
            idMunicipio = "",
            facebook = "",
            twitter = "",
            skype = "",
            linkedIn = "",
            googlePlus = "",
            etiquetas = "",
            tkEtiquetas = ""
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || nombre.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "El campo 'nombre' es obligatorio",
                error: "MISSING_REQUIRED_FIELD"
            });
        }

        if (!apellidos || apellidos.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "El campo 'apellidos' es obligatorio",
                error: "MISSING_REQUIRED_FIELD"
            });
        }

        if (!correo || correo.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "El campo 'correo' es obligatorio",
                error: "MISSING_REQUIRED_FIELD"
            });
        }

        // Validar formato de correo básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            return res.status(400).json({
                success: false,
                message: "El formato del correo electrónico no es válido",
                error: "INVALID_EMAIL_FORMAT"
            });
        }

        console.log('Datos recibidos:', {
            nombre: nombre.trim(),
            apellidos: apellidos.trim(),
            correo: correo.trim(),
            empresa: empresa || 'No especificada',
            telefono2: telefono2 || 'No especificado'
        });

        // Payload base para Upnify
        const payload = {
            "choice_empresa": "",
            "search_terms": "",
            "empresa": empresa,
            "tkEmpresa": "",
            "cp": {
                "estatus": "",
                "validador": "",
                "division": "",
                "tipo": "",
                "gasto": "",
                "periodo": "",
                "tipoDeServicio": "",
                "testFecha": ""
            },
            "nombre": nombre,
            "apellidos": apellidos,
            "titulo": titulo,
            "sexo": sexo,
            "correo": correo,
            "url": url,
            "telefono2LadaPais": "+52",
            "telefono2": telefono2,
            "movilLadaPais": "+52",
            "movil": movil,
            "puesto": puesto,
            "calle": calle,
            "colonia": colonia,
            "idPais": "MX",
            "idEstado": idEstado,
            "idMunicipio": idMunicipio,
            "ciudad": ciudad,
            "codigoPostal": codigoPostal,
            "tkFase": "PFAS-AF9C06CD-A4B2-4A68-8383-241935B40E37",
            "tkOrigen": "",
            "facebook": facebook,
            "twitter": twitter,
            "skype": skype,
            "linkedIn": linkedIn,
            "googlePlus": googlePlus,
            "etiquetas": etiquetas,
            "tkEtiquetas": tkEtiquetas
        };

        console.log('Enviando solicitud a Upnify...', payload);

        const result = await makeUpnifyRequest(payload);
        
        if (result.statusCode === 200 || result.statusCode === 201) {
            res.json({
                success: true,
                message: 'Prospecto creado exitosamente',
                data: result.data
            });
        } else {
            res.status(result.statusCode).json({
                success: false,
                message: 'Error al crear el prospecto',
                error: result.data
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Servir OpenAPI
app.get('/openapi.yaml', (req, res) => {
    res.type('text/yaml').send(openAPISpec);
});

// Endpoint de prueba
app.get('/', (req, res) => {
    res.json({
        message: 'UpnifIA API funcionando correctamente',
        version: '1.0.0',
        endpoints: {
            'POST /crear-prospecto': 'Crear un nuevo prospecto en Upnify',
            'GET /openapi.yaml': 'Documentación OpenAPI para conectar con IA'
        },
        camposObligatorios: {
            nombre: 'Nombre del prospecto (requerido)',
            apellidos: 'Apellidos del prospecto (requerido)',
            correo: 'Correo electrónico válido (requerido)'
        },
        camposOpcionales: [
            'telefono2', 'movil', 'empresa', 'puesto', 'calle', 'ciudad', 
            'idEstado', 'codigoPostal', 'titulo', 'sexo', 'url', 'colonia',
            'idMunicipio', 'facebook', 'twitter', 'skype', 'linkedIn', 
            'googlePlus', 'etiquetas'
        ],
        ejemplo: {
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan@empresa.com',
            empresa: 'Tech Solutions',
            telefono2: '5551234567'
        }
    });
});

// Iniciar servidor
const server = app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
    console.log(`Documentación OpenAPI disponible en: http://localhost:${port}/openapi.yaml`);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
    console.log('Recibida señal SIGTERM, cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Recibida señal SIGINT, cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado correctamente');
        process.exit(0);
    });
});