const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();

// Railway usa PORT environment variable
const port = process.env.PORT || 3001;

// URL base de la API de Upnify
const apiUrl = 'https://api.upnify.com/v4';

app.use(express.json());

// 🔹 Health check endpoint (importante para Railway)
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        service: 'UpnifIA GPT API',
        version: '1.0.2',
        timestamp: new Date().toISOString(),
        message: '🔑 Todos los endpoints requieren token de sesión (tkSesion) del usuario',
        endpoints: [
            'POST /crear-prospecto-completo - Crear prospecto en Upnify (requiere tkSesion)',
            'GET /consultar-ventas - Consultar ventas con filtros flexibles (requiere tkSesion)',
            'GET /consultar-cobros-pendientes - Consultar cobros pendientes (requiere tkSesion)',
            'GET /consultar-prospectos-recientes - Consultar prospectos con filtros (requiere tkSesion)',
            'GET /buscar-contactos - Buscar prospectos y clientes (requiere tkSesion)',
            'POST /crear-oportunidad - Crear oportunidad para un prospecto (requiere tkSesion)',
            'GET /test-upnify - Test de conectividad con Upnify (requiere tkSesion)'
        ],
        note: 'Los usuarios pueden obtener su token desde Upnify → Configuración → API'
    });
});

// 🔹 Servir el archivo OpenAPI para ChatGPT
app.get('/openapi.yaml', (req, res) => {
    console.log('📄 Serving OpenAPI specification...');
    const openapiPath = path.join(__dirname, 'openapi.yaml');
    
    if (fs.existsSync(openapiPath)) {
        res.setHeader('Content-Type', 'application/x-yaml');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.sendFile(openapiPath);
    } else {
        res.status(404).json({ error: 'OpenAPI file not found' });
    }
});

// 🔹 Servir el archivo OpenAPI para ChatGPT
app.get('/openapi.yaml', (req, res) => {
    console.log('📄 Serving OpenAPI specification...');
    const openapiPath = path.join(__dirname, 'openapi.yaml');
    
    if (fs.existsSync(openapiPath)) {
        res.setHeader('Content-Type', 'application/x-yaml');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.sendFile(openapiPath);
    } else {
        res.status(404).json({ error: 'OpenAPI file not found' });
    }
});

// 🔹 Test de conectividad con Upnify
app.get('/test-upnify', (req, res) => {
    const tkSesion = req.query.tkSesion;
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Token de sesión no proporcionado en test-upnify');
        return res.status(400).json({ 
            success: false, 
            error: 'tkSesion es obligatorio. Proporciona tu token de sesión de Upnify como parámetro.',
            help: 'Ejemplo: /test-upnify?tkSesion=TU_TOKEN_AQUI'
        });
    }
    
    console.log(`🧪 Testing Upnify connection - Usuario: ***${tkSesion.slice(-8)}`);
    
    const options = {
        hostname: 'api.upnify.com',
        path: '/v4/prospectos?desde=HOY&hasta=HOY',
        method: 'GET',
        headers: {
            'token': tkSesion,
            'User-Agent': 'UpnifIA/1.0'
        },
        timeout: 10000
    };

    const request = https.request(options, response => {
        let data = '';
        console.log(`📡 Upnify response status: ${response.statusCode}`);
        
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ Upnify connection successful');
                res.json({
                    success: true,
                    status: response.statusCode,
                    message: 'Conexión exitosa con Upnify',
                    prospectos: jsonData.length || 0
                });
            } catch (error) {
                console.error('❌ JSON parse error:', error);
                res.json({
                    success: false,
                    status: response.statusCode,
                    error: 'Error parsing Upnify response',
                    rawData: data.substring(0, 200) + '...'
                });
            }
        });
    });

    request.on('error', error => {
        console.error('❌ Upnify connection error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    });

    request.on('timeout', () => {
        console.error('⏰ Upnify request timeout');
        request.destroy();
        res.status(408).json({
            success: false,
            error: 'Timeout - Upnify API no responde'
        });
    });

    request.end();
});

// 🔹 Endpoint principal para crear prospecto con manejo de errores mejorado
app.post('/crear-prospecto-completo', (req, res) => {
    const payload = req.body;
    const tkSesion = payload.tkSesion;
    
    console.log('📝 Intentando crear prospecto:', {
        usuario: tkSesion ? `***${tkSesion.slice(-8)}` : 'NO PROPORCIONADO',
        nombre: payload.nombre,
        apellidos: payload.apellidos,
        correo: payload.correo
    });
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Token de sesión no proporcionado');
        return res.status(400).json({ 
            success: false, 
            error: 'tkSesion es obligatorio. Proporciona tu token de sesión de Upnify.',
            help: 'Puedes obtener tu token desde tu cuenta de Upnify en Configuración > API'
        });
    }
    
    if (!payload.nombre || !payload.apellidos || !payload.correo) {
        console.log('❌ Faltan campos obligatorios');
        return res.status(400).json({ 
            success: false, 
            error: 'nombre, apellidos y correo son obligatorios' 
        });
    }

    // Crear FormData excluyendo el tkSesion (no debe enviarse en el body)
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
        if (key !== 'tkSesion' && value !== undefined && value !== null) {
            formData.append(key, value);
        }
    }

    const options = {
        hostname: 'api.upnify.com',
        path: '/v4/prospectos',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(formData.toString()),
            'token': tkSesion,
            'User-Agent': 'UpnifIA/1.0'
        },
        timeout: 15000
    };

    const request = https.request(options, response => {
        let data = '';
        console.log(`📡 Create prospect response: ${response.statusCode}`);
        
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                if (response.statusCode === 200 || response.statusCode === 201) {
                    console.log(`✅ Prospecto creado exitosamente: ${payload.nombre} ${payload.apellidos}`);
                } else {
                    console.log(`⚠️ Respuesta no exitosa: ${response.statusCode}`);
                }
                res.status(response.statusCode).json(jsonData);
            } catch (error) {
                console.error('❌ Error parsing response:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error parsing Upnify response',
                    rawData: data.substring(0, 200) + '...'
                });
            }
        });
    });

    request.on('error', error => {
        console.error('❌ Create prospect error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code,
            message: 'Error de conectividad con Upnify'
        });
    });

    request.on('timeout', () => {
        console.error('⏰ Create prospect timeout');
        request.destroy();
        res.status(408).json({
            success: false,
            error: 'Timeout - Upnify API no responde'
        });
    });

    request.write(formData.toString());
    request.end();
});

// 🔹 Consultar ventas con filtros flexibles
app.get('/consultar-ventas', (req, res) => {
    const tkSesion = req.query.tkSesion;
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Token de sesión no proporcionado en consultar-ventas');
        return res.status(400).json({ 
            success: false, 
            error: 'tkSesion es obligatorio. Proporciona tu token de sesión de Upnify.',
            help: 'Puedes obtener tu token desde tu cuenta de Upnify en Configuración > API'
        });
    }
    
    // Parámetros con valores por defecto
    const agrupacion = req.query.agrupacion || 1; // Por ejecutivo por defecto
    const periodicidad = req.query.periodicidad || 4; // Mensual por defecto
    const anio = req.query.anio || new Date().getFullYear(); // Año actual por defecto
    const impuestos = req.query.impuestos !== undefined ? req.query.impuestos : 0; // Sin impuestos por defecto
    
    console.log(`📊 Consultando ventas - Usuario: ***${tkSesion.slice(-8)}, Año: ${anio}, Agrupación: ${agrupacion}, Periodicidad: ${periodicidad}, Impuestos: ${impuestos}`);
    
    const url = `https://api.upnify.com/v4/reportesnv/ventas/realizadas?agrupacion=${agrupacion}&periodicidad=${periodicidad}&anio=${anio}&impuestos=${impuestos}`;
    
    https.get(url, { 
        headers: { 
            'token': tkSesion,
            'User-Agent': 'UpnifIA/1.0'
        } 
    }, response => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log(`✅ Reporte de ventas obtenido - ${jsonData.length || 0} registros`);
                res.json(jsonData);
            } catch (error) {
                console.error('❌ Error parsing ventas:', error);
                res.status(500).json({ error: 'Error parsing response' });
            }
        });
    }).on('error', error => {
        console.error('❌ Error consultando ventas:', error);
        res.status(500).json({ error: error.message });
    });
});

// 🔹 Consultar cobros pendientes con filtros
app.get('/consultar-cobros-pendientes', (req, res) => {
    const tkSesion = req.query.tkSesion;
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Token de sesión no proporcionado en consultar-cobros-pendientes');
        return res.status(400).json({ 
            success: false, 
            error: 'tkSesion es obligatorio. Proporciona tu token de sesión de Upnify.',
            help: 'Puedes obtener tu token desde tu cuenta de Upnify en Configuración > API'
        });
    }
    
    // Parámetros con valores por defecto
    const agrupacion = req.query.agrupacion || 1; // Por ejecutivo por defecto
    const periodicidad = req.query.periodicidad || 4; // Mensual por defecto
    
    console.log(`💰 Consultando cobros pendientes - Usuario: ***${tkSesion.slice(-8)}, Agrupación: ${agrupacion}, Periodicidad: ${periodicidad}`);
    
    const url = `https://api.upnify.com/v4/reportesnv/clientes/cobrospendientes?agrupacion=${agrupacion}&periodicidad=${periodicidad}`;
    
    https.get(url, { 
        headers: { 
            'token': tkSesion,
            'User-Agent': 'UpnifIA/1.0'
        } 
    }, response => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log(`✅ Reporte de cobros pendientes obtenido - ${jsonData.length || 0} registros`);
                res.json(jsonData);
            } catch (error) {
                console.error('❌ Error parsing cobros pendientes:', error);
                res.status(500).json({ error: 'Error parsing response' });
            }
        });
    }).on('error', error => {
        console.error('❌ Error consultando cobros pendientes:', error);
        res.status(500).json({ error: error.message });
    });
});

// 🔹 Consultar prospectos con filtros de período y ejecutivo
app.get('/consultar-prospectos-recientes', (req, res) => {
    const tkSesion = req.query.tkSesion;
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Token de sesión no proporcionado en consultar-prospectos-recientes');
        return res.status(400).json({ 
            success: false, 
            error: 'tkSesion es obligatorio. Proporciona tu token de sesión de Upnify.',
            help: 'Puedes obtener tu token desde tu cuenta de Upnify en Configuración > API'
        });
    }
    
    // Parámetros con valores por defecto
    const pagina = req.query.pagina || 1;
    const cantidadRegistros = req.query.cantidadRegistros || 50;
    const periodo = req.query.periodo; // 1=hoy, 5=mes, 8=año, sin valor=todos
    const tkUsuario = req.query.tkUsuario; // * para todos los ejecutivos, sin valor=solo mis prospectos
    
    console.log(`📋 Consultando prospectos - Usuario: ***${tkSesion.slice(-8)}, Página: ${pagina}, Registros: ${cantidadRegistros}, Período: ${periodo || 'todos'}, Usuario: ${tkUsuario || 'mis prospectos'}`);
    
    // Construir URL de la API de Upnify con parámetros dinámicos
    let url = `https://api.upnify.com/v4/prospectos?pagina=${pagina}&cantidadRegistros=${cantidadRegistros}`;
    
    // Agregar período si se especifica
    if (periodo) {
        url += `&periodo=${periodo}`;
    }
    
    // Agregar usuario si se especifica
    if (tkUsuario) {
        url += `&tkUsuario=${tkUsuario}`;
    }
    
    console.log(`🔗 URL de consulta: ${url}`);
    
    https.get(url, { 
        headers: { 
            'token': tkSesion,
            'User-Agent': 'UpnifIA/1.0'
        } 
    }, response => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                const prospectos = JSON.parse(data);
                console.log(`✅ Prospectos obtenidos de Upnify: ${prospectos.length} registros`);
                
                // Formatear respuesta con información útil
                const resultado = {
                    total: prospectos.length,
                    pagina: parseInt(pagina),
                    cantidadRegistros: parseInt(cantidadRegistros),
                    filtros: {
                        periodo: periodo ? getPeriodoDescripcion(periodo) : 'Todos los períodos',
                        ejecutivo: tkUsuario === '*' ? 'Todos los ejecutivos' : 'Mis prospectos'
                    },
                    prospectos: prospectos.map(prospecto => ({
                        tkProspecto: prospecto.tkProspecto,
                        nombre: prospecto.nombre,
                        apellidos: prospecto.apellidos,
                        contacto: prospecto.contacto,
                        correo: prospecto.correo,
                        telefono: prospecto.telefono,
                        movil: prospecto.movil,
                        fechaContacto: prospecto.fechaContacto,
                        fechaUltimaModificacion: prospecto.fechaUltimaModificacion,
                        ejecutivoNombre: prospecto.ejecutivoNombre,
                        ultimoContacto: prospecto.ultimoContacto,
                        ultimoContactoFechaHora: prospecto.ultimoContactoFechaHora,
                        fase: prospecto.fase,
                        faseColor: prospecto.faseColor,
                        origen: prospecto.origen,
                        pais: prospecto.pais,
                        estado: prospecto.estado,
                        empresa: prospecto.empresa,
                        industria: prospecto.industria,
                        tipo: prospecto.tipo,
                        gasto: prospecto.gasto,
                        periodo: prospecto.periodo,
                        esCliente: prospecto.esCliente,
                        descartado: prospecto.descartado,
                        archivado: prospecto.archivado
                    }))
                };
                
                res.json(resultado);
                
            } catch (error) {
                console.error('❌ Error parsing prospectos:', error);
                res.status(500).json({ 
                    error: 'Error processing prospects data',
                    details: error.message 
                });
            }
        });
    }).on('error', error => {
        console.error('❌ Error consultando prospectos:', error);
        res.status(500).json({ 
            error: 'Error connecting to Upnify API',
            details: error.message 
        });
    });
});

// Función auxiliar para describir los períodos
function getPeriodoDescripcion(periodo) {
    switch (periodo) {
        case '1': return 'Hoy';
        case '5': return 'Mes actual';
        case '8': return 'Año actual';
        default: return `Período ${periodo}`;
    }
}

// 🔹 Buscar contactos (prospectos y clientes) por nombre, correo o teléfono
app.get('/buscar-contactos', (req, res) => {
    const tkSesion = req.query.tkSesion;
    const buscar = req.query.buscar;
    const cantidadRegistros = req.query.cantidadRegistros || 10;
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Token de sesión no proporcionado en buscar-contactos');
        return res.status(400).json({ 
            success: false, 
            error: 'tkSesion es obligatorio. Proporciona tu token de sesión de Upnify.',
            help: 'Puedes obtener tu token desde tu cuenta de Upnify en Configuración > API'
        });
    }
    
    if (!buscar) {
        return res.status(400).json({ 
            error: 'El parámetro "buscar" es obligatorio',
            mensaje: 'Proporciona un nombre, correo o teléfono para buscar'
        });
    }
    
    console.log(`🔍 Buscando contactos - Usuario: ***${tkSesion.slice(-8)}, Búsqueda: "${buscar}", Límite: ${cantidadRegistros}`);
    
    // Construir URL con filtros específicos para prospectos y clientes
    const secciones = ',prospectos,clientes';
    const url = `https://api.upnify.com/v4/sistema/buscar?buscar=${encodeURIComponent(buscar)}&cantidadRegistros=${cantidadRegistros}&secciones=${encodeURIComponent(secciones)}`;
    
    console.log(`🔗 URL de búsqueda: ${url}`);
    
    https.get(url, { 
        headers: { 
            'token': tkSesion,
            'User-Agent': 'UpnifIA/1.0'
        } 
    }, response => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                const resultados = JSON.parse(data);
                
                if (!Array.isArray(resultados) || resultados.length < 2) {
                    return res.json({
                        termino: buscar,
                        total: 0,
                        resumen: { prospectos: 0, clientes: 0 },
                        contactos: [],
                        mensaje: 'No se encontraron resultados'
                    });
                }
                
                // resultados[0] contiene el resumen, resultados[1] contiene los datos
                const resumen = resultados[0][0] || {};
                const contactosRaw = resultados[1] || [];
                
                // Filtrar y formatear solo prospectos y clientes
                const contactos = contactosRaw
                    .filter(item => item.seccion === 'prospectos' || item.seccion === 'clientes')
                    .map(contacto => ({
                        seccion: contacto.seccion,
                        tkProspecto: contacto.tkProspecto,
                        contacto: contacto.contacto,
                        correo: contacto.correo,
                        telefono: contacto.telefono,
                        movil: contacto.movil,
                        ejecutivo: contacto.ejecutivo,
                        ejecutivoIniciales: contacto.ejecutivoIniciales,
                        empresa: contacto.empresa || '',
                        // Generar un identificador único para cada contacto
                        id: `${contacto.seccion}-${contacto.tkProspecto}`
                    }));
                
                const resultado = {
                    termino: buscar,
                    total: contactos.length,
                    resumen: {
                        prospectos: resumen.prospectos || 0,
                        clientes: resumen.clientes || 0
                    },
                    contactos: contactos,
                    mensaje: contactos.length > 1 
                        ? `Se encontraron ${contactos.length} contactos. Para crear una oportunidad, especifica el número de celular, correo o apellidos para ser más preciso.`
                        : contactos.length === 1 
                            ? 'Se encontró 1 contacto exacto'
                            : 'No se encontraron contactos'
                };
                
                console.log(`✅ Búsqueda completada: ${resultado.total} contactos encontrados`);
                res.json(resultado);
                
            } catch (error) {
                console.error('❌ Error parsing búsqueda:', error);
                res.status(500).json({ 
                    error: 'Error processing search results',
                    details: error.message 
                });
            }
        });
    }).on('error', error => {
        console.error('❌ Error en búsqueda:', error);
        res.status(500).json({ 
            error: 'Error connecting to Upnify search API',
            details: error.message 
        });
    });
});

// 🔹 Crear oportunidad para un prospecto
app.post('/crear-oportunidad', (req, res) => {
    const { tkSesion, concepto, tkProspecto, monto, comision } = req.body;
    
    console.log('💼 Intentando crear oportunidad:', {
        usuario: tkSesion ? `***${tkSesion.slice(-8)}` : 'NO PROPORCIONADO',
        concepto: concepto,
        tkProspecto: tkProspecto,
        monto: monto,
        comision: comision
    });
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Token de sesión no proporcionado');
        return res.status(400).json({ 
            success: false, 
            error: 'tkSesion es obligatorio. Proporciona tu token de sesión de Upnify.',
            help: 'Puedes obtener tu token desde tu cuenta de Upnify en Configuración > API'
        });
    }
    
    if (!concepto || !tkProspecto || !monto || comision === undefined) {
        console.log('❌ Faltan campos obligatorios');
        return res.status(400).json({ 
            success: false, 
            error: 'concepto, tkProspecto, monto y comision son obligatorios' 
        });
    }
    
    // Calcular comisionMonto automáticamente
    const comisionMonto = parseFloat(monto) * parseFloat(comision);
    
    // Valores por defecto según tu especificación
    const payload = {
        'cp.fechaDeEntrega': '',
        concepto: concepto,
        tkFase: 'OFAS-F2481C74-02F3-435D-A139-A90EDC05E2E9',
        tkLinea: 'LINP-E302A7F3-C8CD-489B-B9BF-67412CB62D37', 
        tkMoneda: 'MON-ED434B3A-A165-4215-94E5-577327C2EF5E',
        monto: parseFloat(monto),
        tipoCambio: 1,
        comision: parseFloat(comision),
        comisionMonto: comisionMonto,
        cierreEstimado: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días desde hoy
        tkCerteza: 'CER-42A55CB2-776D-49BC-9AAF-185561FBE167',
        cantidad: '',
        tkProspecto: tkProspecto,
        cp: JSON.stringify({ fechaDeEntrega: '' })
    };
    
    console.log('📝 Payload para oportunidad:', payload);
    
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    }

    const options = {
        hostname: 'api.upnify.com',
        path: '/v4/oportunidades',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(formData.toString()),
            'token': tkSesion,
            'User-Agent': 'UpnifIA/1.0'
        }
    };

    const request = https.request(options, response => {
        let data = '';
        console.log(`📡 Upnify response status: ${response.statusCode}`);
        
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                const jsonResponse = JSON.parse(data);
                console.log('✅ Oportunidad creada exitosamente');
                
                res.json({
                    success: true,
                    status: response.statusCode,
                    oportunidad: jsonResponse,
                    detalles: {
                        concepto: concepto,
                        monto: parseFloat(monto),
                        comision: parseFloat(comision),
                        comisionMonto: comisionMonto,
                        tkProspecto: tkProspecto
                    }
                });
                
            } catch (error) {
                console.error('❌ Error parsing oportunidad response:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error parsing Upnify response',
                    statusCode: response.statusCode,
                    rawData: data.substring(0, 500) + '...'
                });
            }
        });
    });

    request.on('error', error => {
        console.error('❌ Error creando oportunidad:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    });

    request.write(formData.toString());
    request.end();
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 UpnifIA GPT API iniciado en puerto ${port}`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🔑 Modo: Token dinámico por usuario`);
    console.log(`📝 Instrucción: Cada usuario debe proporcionar su tkSesion`);
    console.log(`🌐 Health check: http://localhost:${port}/`);
});