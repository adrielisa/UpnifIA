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
            'GET /consultar-prospectos - Consultar prospectos del día',
            'GET /consultar-ventas - Consultar ventas con filtros flexibles',
            'GET /consultar-cobros-pendientes - Consultar cobros pendientes',
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

// 🔹 Consultar prospectos del día
app.get('/consultar-prospectos', (req, res) => {
    console.log('📋 Consultando prospectos del día...');
    
    const options = {
        hostname: 'api.upnify.com',
        path: '/v4/prospectos?desde=HOY&hasta=HOY',
        method: 'GET',
        headers: {
            'token': tkSesion,
            'User-Agent': 'UpnifIA/1.0'
        }
    };

    https.get(`https://api.upnify.com/v4/prospectos?desde=HOY&hasta=HOY`, { 
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
                console.log(`✅ Prospectos obtenidos: ${jsonData.length || 0}`);
                res.json(jsonData);
            } catch (error) {
                console.error('❌ Error parsing prospectos:', error);
                res.status(500).json({ error: 'Error parsing response' });
            }
        });
    }).on('error', error => {
        console.error('❌ Error consultando prospectos:', error);
        res.status(500).json({ error: error.message });
    });
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

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 UpnifIA GPT API iniciado en puerto ${port}`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🔑 Token configurado: ${tkSesion ? 'SÍ' : 'NO'}`);
    console.log(`🌐 Health check: http://localhost:${port}/`);
});