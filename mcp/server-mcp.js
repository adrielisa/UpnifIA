const express = require('express');
const https = require('https');
const app = express();
const port = 3000;
const tkSesion = 'Aqui_va_el_token_de_sesion'; // Reemplazar con el token de sesión real
const apiUrl = 'https://api.upnify.com/v4';

app.use(express.json());

app.get('/get_manifest', (req, res) => res.sendFile(__dirname + '/manifest.json'));

app.post('/list_resources', (req, res) => {
    const { name } = req.body;
    if (name === 'prospectos_diarios') {
        https.get(`${apiUrl}/prospectos?desde=HOY&hasta=HOY`, { headers: { token: tkSesion } }, r => {
            let data = '';
            r.on('data', chunk => data += chunk);
            r.on('end', () => res.json({ resource: 'prospectos_diarios', data: JSON.parse(data) }));
        });
    } else if (name === 'ventas_mensuales') {
        const year = new Date().getFullYear();
        https.get(`${apiUrl}/reportesnv/ventas/realizadas?agrupacion=1&periodicidad=4&anio=${year}`, { headers: { token: tkSesion } }, r => {
            let data = '';
            r.on('data', chunk => data += chunk);
            r.on('end', () => res.json({ resource: 'ventas_mensuales', data: JSON.parse(data) }));
        });
    } else res.status(404).send('Recurso no encontrado');
});

app.post('/run_tool', (req, res) => {
    const { name, input } = req.body;
    if (name === 'crear_prospecto') {
        const payload = new URLSearchParams({ nombre: input.nombre, apellidos: input.apellidos, correo: input.correo }).toString();
        const options = {
            hostname: 'api.upnify.com',
            path: '/v4/prospectos',
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'token': tkSesion }
        };
        const r = https.request(options, r2 => {
            let data = '';
            r2.on('data', chunk => data += chunk);
            r2.on('end', () => res.json({ result: JSON.parse(data) }));
        });
        r.write(payload); r.end();
    } else if (name === 'mensaje_cliente_casual') {
        const saludo = `¡Hola ${input.nombre}! ¿Qué tal todo? Sólo pasaba a saludar 😉`;
        res.json({ result: saludo });
    } else res.status(404).send('Tool no encontrada');
});

app.listen(port, () => console.log(`UpnifIA MCP corriendo en http://localhost:${port}`));