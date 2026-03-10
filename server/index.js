require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for mobile/web compatibility
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Enable gzip compression for all responses
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// Routes Placeholder
app.get('/', (req, res) => {
    res.send('Stock Manager API Running');
});

// Import Routes
app.use('/api/stock', require('./routes/stock'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/areas', require('./routes/areas'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/transfers', require('./routes/transfers'));







// Start Server
// Start Server only if not in production/serverless environment or if running directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
