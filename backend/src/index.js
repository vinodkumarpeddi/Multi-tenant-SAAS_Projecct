require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Multi-Tenant SaaS API Server                    ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on port: ${PORT}                            ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(41)}║
║  Health check: http://localhost:${PORT}/api/health           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
