const express = require('express');
const https = require('https');
const app = express();
const port = 3001;

// Token de sesión de Upnify
const tkSesion = 'P07N0RFQjQ0QkQtQzY5Ny00MTQwLUJBQzEtRjhEMDY0RTA2NDRB';
const apiUrl = 'https://api.upnify.com/v4';

app.use(express.json());

// 🔹 Endpoint principal para crear prospecto con todos los campos
app.post('/crear-prospecto-completo', (req, res) => {
    const payload = req.body;
    if (!payload.nombre || !payload.apellidos || !payload.correo) {
        return res.status(400).json({ success: false, error: 'nombre, apellidos y correo son obligatorios' });
    }

    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) formData.append(key, value);
    }

    const options = {
        hostname: 'api.upnify.com',
        path: '/v4/prospectos',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(formData.toString()),
            'token': tkSesion
        }
    };

    const request = https.request(options, response => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            console.log(`✅ Prospecto creado: ${payload.nombre} ${payload.apellidos}`);
            res.status(response.statusCode).json(JSON.parse(data));
        });
    });

    request.write(formData.toString());
    request.end();
});

// 🔹 Consultar prospectos del día
app.get('/consultar-prospectos', (req, res) => {
    const url = `${apiUrl}/prospectos?desde=HOY&hasta=HOY`;
    https.get(url, { headers: { token: tkSesion } }, response => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => res.json(JSON.parse(data)));
    });
});

// 🔹 Consultar ventas actuales
app.get('/consultar-ventas', (req, res) => {
    const year = new Date().getFullYear();
    const url = `${apiUrl}/reportesnv/ventas/realizadas?agrupacion=1&periodicidad=4&anio=${year}`;
    https.get(url, { headers: { token: tkSesion } }, response => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => res.json(JSON.parse(data)));
    });
});

// Servidor activo
app.listen(port, () => console.log(`✅ API REST UpnifIA (GPT) corriendo en http://localhost:${port}`));
