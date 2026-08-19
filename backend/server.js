/**
 * Zetrix AI Academy — Backend Server
 * Simplified for Render deployment with static frontend
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 10000;

const { authenticate, JWT_SECRET } = require('./middleware/auth');
const { isMongo } = require('./config/database');

// ===== CORS =====
app.use(cors({
    origin: true,
    credentials: true
}));

// ===== Body Parsing =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===== Request Logging =====
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ===== API Routes =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/oauth', require('./routes/oauth'));
app.use('/api/users', authenticate, require('./routes/users'));
app.use('/api/materials', authenticate, require('./routes/materials'));
app.use('/api/study', authenticate, require('./routes/study'));
app.use('/api/tutor', authenticate, require('./routes/tutor'));
app.use('/api/analytics', authenticate, require('./routes/analytics'));
app.use('/api/workbooks', authenticate, require('./routes/workbooks'));
app.use('/api/admin', authenticate, require('./routes/admin'));
app.use('/api/certificates', authenticate, require('./routes/certificates'));

// ===== Auth Status Endpoint =====
app.get('/api/auth/me', authenticate, (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role } });
});

// ===== Logout =====
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ success: true });
});

// ===== Health Check =====
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ===== Block sensitive files =====
app.use((req, res, next) => {
    const blocked = ['package.json', '.env', '.env.example', '.gitignore'];
    if (blocked.includes(req.path.split('/').pop())) {
        return res.status(403).send('Forbidden');
    }
    next();
});

// ===== Serve Static Frontend =====
// Serve static files from parent directory (repo root)
app.use(express.static(path.join(__dirname, '..')));

// ===== SPA Catch-All: serve index.html for any non-API route =====
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zetrix AI Academy Server running on port ${PORT}`);
    console.log(`Database: ${isMongo ? 'MongoDB' : 'In-Memory (set MONGODB_URI for persistence)'}`);
});

module.exports = app;
