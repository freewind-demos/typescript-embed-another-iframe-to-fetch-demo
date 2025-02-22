import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

app.get('/api/fetchData', (req, res) => {
    const referer = req.headers.referer;
    if (!referer || !referer.includes('/inner.html')) {
        res.status(403).json({ error: 'Access denied. Only allowed from inner.html' });
        return;
    }
    res.json({
        message: 'Hello from API!',
        timestamp: new Date().toISOString(),
        data: [1, 2, 3, 4, 5]
    });
});

app.post('/api/complexData', (req, res) => {
    const referer = req.headers.referer;
    if (!referer || !referer.includes('/inner.html')) {
        res.status(403).json({ error: 'Access denied. Only allowed from inner.html' });
        return;
    }

    const { name, age } = req.body;
    const userAgent = req.headers['user-agent'];
    const customHeader = req.headers['x-custom-header'];

    res.json({
        message: 'Complex API Response',
        timestamp: new Date().toISOString(),
        receivedData: {
            name,
            age,
            headers: {
                userAgent,
                customHeader
            }
        },
        processed: {
            nameLength: name?.length || 0,
            isAdult: age >= 18,
            requestTime: new Date().toISOString()
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 