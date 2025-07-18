const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();

// Railway usa PORT environment variable
const port = process.env.PORT || 3001;

// Token de sesión de Upnify (mejor usar variable de entorno)
const tkSesion = process.env.UPNIFY_TOKEN || 'P07QUQ0QzVFOTYtMjdGMC00NkI2LTgwNzEtOUExMjk2QTgyNjc4';
const apiUrl = 'https://api.upnify.com/v4';

app.use(express.json());

// 🔹 Health check endpoint (importante para Railway)
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        service: 'UpnifIA GPT API',
        version: '1.0.1',
        timestamp: new Date().toISOString(),
        endpoints: [
            'POST /crear-prospecto-completo - Crear prospecto en Upnify',
            'GET /consultar-ventas - Consultar ventas con filtros flexibles',
            'GET /consultar-cobros-pendientes - Consultar cobros pendientes',
            'GET /consultar-prospectos-recientes - Consultar prospectos con filtros de período y ejecutivo',
            'GET /test-upnify - Test de conectividad con Upnify'
        ]
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
    console.log('🧪 Testing Upnify connection...');
    
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
    
    console.log('📝 Intentando crear prospecto:', {
        nombre: payload.nombre,
        apellidos: payload.apellidos,
        correo: payload.correo
    });
    
    if (!payload.nombre || !payload.apellidos || !payload.correo) {
        console.log('❌ Faltan campos obligatorios');
        return res.status(400).json({ 
            success: false, 
            error: 'nombre, apellidos y correo son obligatorios' 
        });
    }

    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
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
    // Parámetros con valores por defecto
    const agrupacion = req.query.agrupacion || 1; // Por ejecutivo por defecto
    const periodicidad = req.query.periodicidad || 4; // Mensual por defecto
    const anio = req.query.anio || new Date().getFullYear(); // Año actual por defecto
    const impuestos = req.query.impuestos !== undefined ? req.query.impuestos : 0; // Sin impuestos por defecto
    
    console.log(`📊 Consultando ventas - Año: ${anio}, Agrupación: ${agrupacion}, Periodicidad: ${periodicidad}, Impuestos: ${impuestos}`);
    
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
    // Parámetros con valores por defecto
    const agrupacion = req.query.agrupacion || 1; // Por ejecutivo por defecto
    const periodicidad = req.query.periodicidad || 4; // Mensual por defecto
    
    console.log(`💰 Consultando cobros pendientes - Agrupación: ${agrupacion}, Periodicidad: ${periodicidad}`);
    
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
    // Parámetros con valores por defecto
    const pagina = req.query.pagina || 1;
    const cantidadRegistros = req.query.cantidadRegistros || 50;
    const periodo = req.query.periodo; // 1=hoy, 5=mes, 8=año, sin valor=todos
    const tkUsuario = req.query.tkUsuario; // * para todos los ejecutivos, sin valor=solo mis prospectos
    
    console.log(`📋 Consultando prospectos - Página: ${pagina}, Registros: ${cantidadRegistros}, Período: ${periodo || 'todos'}, Usuario: ${tkUsuario || 'mis prospectos'}`);
    
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

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 UpnifIA GPT API iniciado en puerto ${port}`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🔑 Token configurado: ${tkSesion ? 'SÍ' : 'NO'}`);
    console.log(`🌐 Health check: http://localhost:${port}/`);
});