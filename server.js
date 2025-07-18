const express = require('express');
const https = require('https');
const app = express();
const port = 3000;

// Este es tu token real de Upnify
const tkSesion = 'P07N0RFQjQ0QkQtQzY5Ny00MTQwLUJBQzEtRjhEMDY0RTA2NDRB';

// Endpoints Upnify
const apiUrl = 'https://api.upnify.com/v4';

// Activamos JSON por default
app.use(express.json());

// Endpoint para devolver el manifest MCP
app.get('/get_manifest', (req, res) => {
    res.sendFile(__dirname + '/manifest.json');
});

// Resource: prospectos_diarios
app.post('/list_resources', async (req, res) => {
    const { name } = req.body;

    if (name === 'prospectos_diarios') {
        const url = `${apiUrl}/prospectos?desde=HOY&hasta=HOY`;

        const request = https.get(url, {
            headers: { token: tkSesion }
        }, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => res.json({ resource: 'prospectos_diarios', data: JSON.parse(data) }));
        });

        request.on('error', err => res.status(500).send(err.message));
        request.end();

    } else if (name === 'ventas_mensuales') {
        const today = new Date();
        const year = today.getFullYear();

        const reportUrl = `${apiUrl}/reportesnv/ventas/realizadas?agrupacion=1&periodicidad=4&anio=${year}`;

        const request = https.get(reportUrl, {
            headers: { token: tkSesion }
        }, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => res.json({ resource: 'ventas_mensuales', data: JSON.parse(data) }));
        });

        request.on('error', err => res.status(500).send(err.message));
        request.end();

    } else {
        res.status(404).send('Recurso no encontrado');
    }
});

// Tool: crear_prospecto
app.post('/run_tool', (req, res) => {
    const { name, input } = req.body;

    if (name === 'crear_prospecto') {
        const prospecto = {
            nombre: input.nombre,
            apellidos: input.apellidos,
            correo: input.correo
        };

        const postData = new URLSearchParams(prospecto).toString();

        const options = {
            hostname: 'api.upnify.com',
            path: '/v4/prospectos',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'token': tkSesion
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => res.json({ result: JSON.parse(data) }));
        });

        request.on('error', err => res.status(500).send(err.message));
        request.write(postData);
        request.end();

    } else if (name === 'mensaje_cliente_casual') {
        const saludo = `Hola ${input.nombre}! ¿Cómo va todo? Solo quería escribirte algo rápido 😉`;
        res.json({ result: saludo });

    } else {
        res.status(404).send('Tool no encontrada');
    }
});

app.listen(port, () => console.log(`UpnifIA MCP corriendo en http://localhost:${port}`));
