const express = require('express');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Configuration
const tkSesion = 'P07N0RFQjQ0QkQtQzY5Ny00MTQwLUJBQzEtRjhEMDY0RTA2NDRB';
const apiUrl = 'https://api.upnify.com/v4/prospectos';
const reportesUrl = 'https://api.upnify.com/v4/reportesnv/ventas/realizadas';

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
  /consultar-reportes:
    get:
      summary: Consultar reportes de ventas realizadas
      operationId: consultarReportes
      parameters:
        - name: agrupacion
          in: query
          required: true
          schema:
            type: integer
            enum: [1, 2, 3, 4, 5, 6, 17]
            description: "Tipo de agrupación: 1=Por ejecutivo, 2=Por grupo, 3=Por línea, 4=Por origen, 5=Por país, 6=Por región, 17=Por industria"
            example: 1
        - name: periodicidad
          in: query
          required: true
          schema:
            type: integer
            enum: [1, 2, 3, 4, 5, 6]
            description: "Periodicidad: 1=Semestral, 2=Trimestral, 3=Bimestral, 4=Mensual, 5=Quincenal, 6=Semanal"
            example: 4
        - name: anio
          in: query
          required: true
          schema:
            type: integer
            minimum: 2009
            maximum: 2025
            description: "Año del reporte (2009-2025)"
            example: 2025
        - name: impuestos
          in: query
          required: false
          schema:
            type: integer
            enum: [0, 1]
            description: "Incluir impuestos: 0=Excluir, 1=Incluir"
            example: 0
            default: 0
      responses:
        '200':
          description: Reporte de ventas obtenido exitosamente
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
                    type: array
                    items:
                      type: object
                      properties:
                        indice:
                          type: integer
                          description: Índice del registro
                        idPais:
                          type: string
                          description: ID del país
                        idEstado:
                          type: string
                          description: ID del estado
                        estado:
                          type: string
                          description: Nombre del estado
                        moneda:
                          type: string
                          description: Moneda utilizada
                        _TOT:
                          type: number
                          description: Total de ventas
                      additionalProperties:
                        type: number
                        description: "Ventas por período. Los campos varían según la periodicidad: _TRI1-_TRI4 (trimestral), _ENE-_DIC (mensual), _SMN1-_SMN52 (semanal), etc."
                  parametros:
                    type: object
                    properties:
                      agrupacion:
                        type: string
                        description: Descripción de la agrupación utilizada
                      periodicidad:
                        type: string
                        description: Descripción de la periodicidad utilizada
                      anio:
                        type: integer
                        description: Año consultado
                      impuestos:
                        type: string
                        description: Si se incluyen o excluyen impuestos
                      estructuraCampos:
                        type: string
                        description: "Explicación de los campos de período: Trimestral=_TRI1 a _TRI4, Mensual=_ENE a _DIC, Semanal=_SMN1 a _SMN52, etc."
        '400':
          description: Error en los parámetros de la solicitud
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

// Función para hacer request GET a reportes de Upnify
function makeUpnifyReportRequest(queryParams) {
    return new Promise((resolve, reject) => {
        const url = new URL(reportesUrl);
        
        // Agregar parámetros de consulta
        Object.keys(queryParams).forEach(key => {
            if (queryParams[key] !== undefined && queryParams[key] !== null) {
                url.searchParams.append(key, queryParams[key]);
            }
        });
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
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

// Endpoint para consultar reportes
app.get('/consultar-reportes', async (req, res) => {
    try {
        const { agrupacion, periodicidad, anio, impuestos = 0 } = req.query;
        
        // Validar parámetros obligatorios
        if (!agrupacion) {
            return res.status(400).json({
                success: false,
                message: "El parámetro 'agrupacion' es obligatorio",
                error: "MISSING_REQUIRED_PARAMETER"
            });
        }
        
        if (!periodicidad) {
            return res.status(400).json({
                success: false,
                message: "El parámetro 'periodicidad' es obligatorio",
                error: "MISSING_REQUIRED_PARAMETER"
            });
        }
        
        if (!anio) {
            return res.status(400).json({
                success: false,
                message: "El parámetro 'anio' es obligatorio",
                error: "MISSING_REQUIRED_PARAMETER"
            });
        }
        
        // Validar valores de agrupación
        const agrupacionesValidas = [1, 2, 3, 4, 5, 6, 17];
        if (!agrupacionesValidas.includes(parseInt(agrupacion))) {
            return res.status(400).json({
                success: false,
                message: "Agrupación inválida. Valores permitidos: 1=Por ejecutivo, 2=Por grupo, 3=Por línea, 4=Por origen, 5=Por país, 6=Por región, 17=Por industria",
                error: "INVALID_AGRUPACION"
            });
        }
        
        // Validar valores de periodicidad
        const periodicidadesValidas = [1, 2, 3, 4, 5, 6];
        if (!periodicidadesValidas.includes(parseInt(periodicidad))) {
            return res.status(400).json({
                success: false,
                message: "Periodicidad inválida. Valores permitidos: 1=Semestral, 2=Trimestral, 3=Bimestral, 4=Mensual, 5=Quincenal, 6=Semanal",
                error: "INVALID_PERIODICIDAD"
            });
        }
        
        // Validar año
        const anioNum = parseInt(anio);
        if (anioNum < 2009 || anioNum > 2025) {
            return res.status(400).json({
                success: false,
                message: "Año inválido. Debe estar entre 2009 y 2025",
                error: "INVALID_YEAR"
            });
        }
        
        // Validar impuestos
        const impuestosValidos = [0, 1];
        if (!impuestosValidos.includes(parseInt(impuestos))) {
            return res.status(400).json({
                success: false,
                message: "Valor de impuestos inválido. Valores permitidos: 0=Excluir, 1=Incluir",
                error: "INVALID_IMPUESTOS"
            });
        }
        
        // Mapear valores para respuesta amigable
        const agrupacionMap = {
            1: 'Por ejecutivo',
            2: 'Por grupo',
            3: 'Por línea',
            4: 'Por origen',
            5: 'Por país',
            6: 'Por región',
            17: 'Por industria'
        };
        
        const periodicidadMap = {
            1: 'Semestral',
            2: 'Trimestral',
            3: 'Bimestral',
            4: 'Mensual',
            5: 'Quincenal',
            6: 'Semanal'
        };
        
        const impuestosMap = {
            0: 'Excluir impuestos',
            1: 'Incluir impuestos'
        };
        
        // Mapear estructura de campos según periodicidad
        const estructuraCamposMap = {
            1: 'Campos: _SEM1, _SEM2 (semestres) + _TOT',
            2: 'Campos: _TRI1, _TRI2, _TRI3, _TRI4 (trimestres) + _TOT',
            3: 'Campos: _BIM1, _BIM2, _BIM3, _BIM4, _BIM5, _BIM6 (bimestres) + _TOT',
            4: 'Campos: _ENE, _FEB, _MAR, _ABR, _MAY, _JUN, _JUL, _AGO, _SEP, _OCT, _NOV, _DIC (meses) + _TOT',
            5: 'Campos: _QNA1, _QNA2, ... _QNA24 (quincenas) + _TOT',
            6: 'Campos: _SMN1, _SMN2, ... _SMN52 (semanas) + _TOT'
        };
        
        const queryParams = {
            agrupacion: parseInt(agrupacion),
            periodicidad: parseInt(periodicidad),
            anio: anioNum,
            impuestos: parseInt(impuestos)
        };
        
        console.log('Consultando reportes con parámetros:', queryParams);
        
        const result = await makeUpnifyReportRequest(queryParams);
        
        if (result.statusCode === 200) {
            res.json({
                success: true,
                message: 'Reporte obtenido exitosamente',
                data: result.data,
                parametros: {
                    agrupacion: agrupacionMap[parseInt(agrupacion)],
                    periodicidad: periodicidadMap[parseInt(periodicidad)],
                    anio: anioNum,
                    impuestos: impuestosMap[parseInt(impuestos)],
                    estructuraCampos: estructuraCamposMap[parseInt(periodicidad)]
                }
            });
        } else {
            res.status(result.statusCode).json({
                success: false,
                message: 'Error al consultar el reporte',
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
            'GET /consultar-reportes': 'Consultar reportes de ventas realizadas',
            'GET /openapi.yaml': 'Documentación OpenAPI para conectar con IA'
        },
        ejemplos: {
            'crear-prospecto': {
                nombre: 'Juan',
                apellidos: 'Pérez',
                correo: 'juan@empresa.com',
                empresa: 'Tech Solutions',
                telefono2: '5551234567'
            },
            'consultar-reportes': {
                url: '/consultar-reportes?agrupacion=1&periodicidad=4&anio=2025&impuestos=0',
                parametros: {
                    agrupacion: '1=Por ejecutivo, 2=Por grupo, 3=Por línea, 4=Por origen, 5=Por país, 6=Por región, 17=Por industria',
                    periodicidad: '1=Semestral, 2=Trimestral, 3=Bimestral, 4=Mensual, 5=Quincenal, 6=Semanal',
                    anio: '2009-2025',
                    impuestos: '0=Excluir, 1=Incluir'
                },
                nota: 'La estructura de campos en la respuesta cambia según la periodicidad: Trimestral=_TRI1-_TRI4, Mensual=_ENE-_DIC, Semanal=_SMN1-_SMN52, etc.'
            }
        },
        camposObligatorios: {
            'crear-prospecto': {
                nombre: 'Nombre del prospecto (requerido)',
                apellidos: 'Apellidos del prospecto (requerido)',
                correo: 'Correo electrónico válido (requerido)'
            },
            'consultar-reportes': {
                agrupacion: 'Tipo de agrupación (requerido)',
                periodicidad: 'Periodicidad del reporte (requerido)',
                anio: 'Año del reporte (requerido)'
            }
        },
        camposOpcionales: [
            'telefono2', 'movil', 'empresa', 'puesto', 'calle', 'ciudad', 
            'idEstado', 'codigoPostal', 'titulo', 'sexo', 'url', 'colonia',
            'idMunicipio', 'facebook', 'twitter', 'skype', 'linkedIn', 
            'googlePlus', 'etiquetas', 'impuestos'
        ]
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