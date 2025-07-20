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

// 🔹 Helper function para convertir numeroIdentificador a tkSesion
function extraerToken(req) {
    // Para requests GET (query parameters)
    const numeroIdentificador = req.query?.numeroIdentificador || req.body?.numeroIdentificador;
    
    if (numeroIdentificador) {
        console.log(`🔄 Convirtiendo numeroIdentificador a tkSesion: ***${numeroIdentificador.slice(-8)}`);
        return numeroIdentificador; // En realidad es el mismo valor, solo cambio de nombre
    }
    
    // Fallback: también acepta tkSesion para retrocompatibilidad
    return req.query?.tkSesion || req.body?.tkSesion;
}

// 🔹 Health check endpoint (importante para Railway)
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        service: 'UpnifIA GPT API',
        version: '1.1.0',
        timestamp: new Date().toISOString(),
        message: '🔑 Todos los endpoints requieren número identificador (numeroIdentificador) del usuario',
        endpoints: [
            'POST /crear-prospecto-completo - Crear prospecto en Upnify (requiere numeroIdentificador)',
            'GET /consultar-ventas - Consultar ventas con filtros flexibles (requiere numeroIdentificador)',
            'GET /consultar-cobros-pendientes - Consultar cobros pendientes (requiere numeroIdentificador)',
            'GET /consultar-prospectos-recientes - Consultar prospectos con filtros (requiere numeroIdentificador)',
            'GET /buscar-contactos - Buscar prospectos y clientes (requiere numeroIdentificador)',
            'POST /crear-oportunidad - Crear oportunidad para un prospecto (requiere numeroIdentificador)',
            'GET /test-upnify - Test de conectividad con Upnify (requiere numeroIdentificador)'
        ],
        note: 'Los usuarios pueden obtener su número identificador desde Upnify → Configuración → API',
        improvement: '🚀 Ahora usa "numeroIdentificador" para mejor compatibilidad con ChatGPT'
    });
});

// 🔹 Servir el archivo OpenAPI para ChatGPT con cache-busting
app.get('/openapi.yaml', (req, res) => {
    console.log('📄 Serving OpenAPI specification v1.1.0 with numeroIdentificador support...');
    const openapiPath = path.join(__dirname, 'openapi.yaml');
    
    if (fs.existsSync(openapiPath)) {
        res.setHeader('Content-Type', 'application/x-yaml');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-OpenAPI-Version', '1.1.0');
        res.setHeader('X-Last-Modified', new Date().toISOString());
        res.sendFile(openapiPath);
    } else {
        res.status(404).json({ error: 'OpenAPI file not found' });
    }
});

// 🔹 Endpoint de debugging para verificar versión del OpenAPI
app.get('/openapi-debug', (req, res) => {
    const openapiPath = path.join(__dirname, 'openapi.yaml');
    
    if (fs.existsSync(openapiPath)) {
        const content = fs.readFileSync(openapiPath, 'utf8');
        const versionMatch = content.match(/version:\s*([^\n]+)/);
        const version = versionMatch ? versionMatch[1].trim() : 'unknown';
        
        res.json({
            status: 'OK',
            openapi_version: version,
            file_exists: true,
            file_path: openapiPath,
            timestamp: new Date().toISOString(),
            content_preview: content.substring(0, 500) + '...',
            tkSesion_found: content.includes('tkSesion'),
            lines_count: content.split('\n').length
        });
    } else {
        res.status(404).json({ 
            error: 'OpenAPI file not found',
            file_path: openapiPath,
            timestamp: new Date().toISOString()
        });
    }
});

// 🔹 Test de conectividad con Upnify
app.get('/test-upnify', (req, res) => {
    const tkSesion = extraerToken(req);
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Número identificador no proporcionado en test-upnify');
        return res.status(400).json({ 
            success: false, 
            error: 'numeroIdentificador es obligatorio. Proporciona tu número identificador de Upnify como parámetro.',
            help: 'Ejemplo: /test-upnify?numeroIdentificador=TU_NUMERO_AQUI'
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
    const tkSesion = extraerToken(req);
    
    console.log('📝 Intentando crear prospecto:', {
        usuario: tkSesion ? `***${tkSesion.slice(-8)}` : 'NO PROPORCIONADO',
        nombre: payload.nombre,
        apellidos: payload.apellidos,
        correo: payload.correo
    });
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Número identificador no proporcionado');
        return res.status(400).json({ 
            success: false, 
            error: 'numeroIdentificador es obligatorio. Proporciona tu número identificador de Upnify.',
            help: 'Puedes obtener tu número identificador desde tu cuenta de Upnify en Configuración > API'
        });
    }
    
    if (!payload.nombre || !payload.apellidos || !payload.correo) {
        console.log('❌ Faltan campos obligatorios');
        return res.status(400).json({ 
            success: false, 
            error: 'nombre, apellidos y correo son obligatorios' 
        });
    }

    // Crear FormData excluyendo el numeroIdentificador y tkSesion (no deben enviarse en el body)
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
        if (key !== 'numeroIdentificador' && key !== 'tkSesion' && value !== undefined && value !== null) {
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
    const tkSesion = extraerToken(req);
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Número identificador no proporcionado en consultar-ventas');
        return res.status(400).json({ 
            success: false, 
            error: 'numeroIdentificador es obligatorio. Proporciona tu número identificador de Upnify.',
            help: 'Puedes obtener tu número identificador desde tu cuenta de Upnify en Configuración > API'
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
    const tkSesion = extraerToken(req);
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Número identificador no proporcionado en consultar-cobros-pendientes');
        return res.status(400).json({ 
            success: false, 
            error: 'numeroIdentificador es obligatorio. Proporciona tu número identificador de Upnify.',
            help: 'Puedes obtener tu número identificador desde tu cuenta de Upnify en Configuración > API'
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
    const tkSesion = extraerToken(req);
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Número identificador no proporcionado en consultar-prospectos-recientes');
        return res.status(400).json({ 
            success: false, 
            error: 'numeroIdentificador es obligatorio. Proporciona tu número identificador de Upnify.',
            help: 'Puedes obtener tu número identificador desde tu cuenta de Upnify en Configuración > API'
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
    const tkSesion = extraerToken(req);
    const buscar = req.query.buscar;
    const cantidadRegistros = req.query.cantidadRegistros || 10;
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Número identificador no proporcionado en buscar-contactos');
        return res.status(400).json({ 
            success: false, 
            error: 'numeroIdentificador es obligatorio. Proporciona tu número identificador de Upnify.',
            help: 'Puedes obtener tu número identificador desde tu cuenta de Upnify en Configuración > API'
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
    const { concepto, tkProspecto, monto, comision } = req.body;
    const tkSesion = extraerToken(req);
    
    console.log('💼 Intentando crear oportunidad:', {
        usuario: tkSesion ? `***${tkSesion.slice(-8)}` : 'NO PROPORCIONADO',
        concepto: concepto,
        tkProspecto: tkProspecto,
        monto: monto,
        comision: comision
    });
    
    // Validar token de sesión
    if (!tkSesion) {
        console.log('❌ Número identificador no proporcionado');
        return res.status(400).json({ 
            success: false, 
            error: 'numeroIdentificador es obligatorio. Proporciona tu número identificador de Upnify.',
            help: 'Puedes obtener tu número identificador desde tu cuenta de Upnify en Configuración > API'
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
    console.log(`🔑 Modo: Número identificador dinámico por usuario`);
    console.log(`📝 Instrucción: Cada usuario debe proporcionar su numeroIdentificador`);
    console.log(`🌐 Health check: http://localhost:${port}/`);
    console.log(`🚀 Nueva versión 1.1.0: Cambio de "tkSesion" a "numeroIdentificador" para mejor compatibilidad con ChatGPT`);
});