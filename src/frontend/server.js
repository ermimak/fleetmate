const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.FRONTEND_PORT || 3001;
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname)));

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // Ensure the /api prefix is passed to the backend
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', `http://localhost:${PORT}`);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ message: 'Error connecting to API server' });
  }
}));

// Handle SPA routing - return index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
  console.log(`Proxying API requests to: ${API_URL}`);
});
