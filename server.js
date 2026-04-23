// server.js - AVEC PROXYS WEBSHARE (FONCTIONNEL)
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Configuration Render
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// IMPORTANT: Liste de vos proxys WebShare
const PROXY_LIST = [
  'http://ookmbosz:01funk1prv93@31.59.20.176:6754',
  'http://ookmbosz:01funk1prv93@198.23.239.134:6540',
  'http://ookmbosz:01funk1prv93@45.38.107.97:6014',
  'http://ookmbosz:01funk1prv93@107.172.163.27:6543',
  'http://ookmbosz:01funk1prv93@198.105.121.200:6462',
  'http://ookmbosz:01funk1prv93@216.10.27.159:6837',
  'http://ookmbosz:01funk1prv93@142.111.67.146:5611',
  'http://ookmbosz:01funk1prv93@191.96.254.138:6185',
  'http://ookmbosz:01funk1prv93@31.58.9.4:6077',
  'http://ookmbosz:01funk1prv93@104.239.107.47:5699',
];

let currentProxyIndex = 0;

function getNextProxy() {
  const proxy = PROXY_LIST[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % PROXY_LIST.length;
  return proxy;
}

const app = express();
app.use(cors());

// Logging
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// Configuration du token
let cachedToken = null;
let tokenExpiry = null;

async function getValidToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  console.log('🔄 Obtention d\'un nouveau token...');
  
  for (let i = 0; i < PROXY_LIST.length; i++) {
    const proxyUrl = getNextProxy();
    
    try {
      const agent = new HttpsProxyAgent(proxyUrl, { rejectUnauthorized: false });
      
      const response = await axios.post(
        'https://mdamsigicmu.sec.gouv.sn/api/authenticate',
        { username: 'caisse_sencsu', password: 'passer' },
        { httpsAgent: agent, timeout: 15000 }
      );
      
      cachedToken = response.data.id_token;
      tokenExpiry = Date.now() + (4 * 60 * 60 * 1000); // 4 heures
      console.log('✅ Nouveau token obtenu');
      return cachedToken;
      
    } catch (error) {
      console.log(`❌ Proxy ${i + 1} échoué: ${error.message}`);
    }
  }
  
  throw new Error('Aucun proxy n\'a fonctionné pour l\'authentification');
}

// API Proxy endpoint
app.get('/api/*', async (req, res) => {
  try {
    const token = await getValidToken();
    const apiPath = req.params[0]; // Récupère tout après /api/
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    
    // Construire l'URL complète de l'API CSU
    const apiUrl = `https://mdamsigicmu.sec.gouv.sn/services/udam/api/${apiPath}${queryString}`;
    
    console.log(`🔄 Appel API: ${apiUrl}`);
    
    // Essayer chaque proxy
    for (let i = 0; i < PROXY_LIST.length; i++) {
      const proxyUrl = getNextProxy();
      
      try {
        const agent = new HttpsProxyAgent(proxyUrl, { rejectUnauthorized: false });
        
        const response = await axios.get(apiUrl, {
          headers: { 'Authorization': `Bearer ${token}` },
          httpsAgent: agent,
          timeout: 15000
        });
        
        console.log(`✅ Réponse API: ${response.status}`);
        return res.json(response.data);
        
      } catch (error) {
        console.log(`❌ Proxy ${i + 1} échoué: ${error.message}`);
      }
    }
    
    throw new Error('Tous les proxys ont échoué');
    
  } catch (error) {
    console.error('❌ Erreur API:', error.message);
    res.status(500).json({ 
      error: 'Erreur API', 
      message: error.message 
    });
  }
});

// Test endpoint
app.get('/test-api', async (req, res) => {
  try {
    const token = await getValidToken();
    const testCode = req.query.code || 'V9676R6540';
    
    // Essayer avec le premier proxy
    const proxyUrl = PROXY_LIST[0];
    const agent = new HttpsProxyAgent(proxyUrl, { rejectUnauthorized: false });
    
    const response = await axios.get(
      `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${testCode}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        httpsAgent: agent,
        timeout: 15000
      }
    );
    
    res.json({
      success: true,
      proxy: proxyUrl.split('@').pop(),
      status: response.status
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    token_valid: cachedToken !== null,
    proxies_available: PROXY_LIST.length
  });
});

// Servir les fichiers Angular
app.use(express.static(path.join(__dirname, 'dist/carte-verification/browser')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/carte-verification/browser/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔧 ${PROXY_LIST.length} proxys WebShare configurés`);
  console.log(`🧪 Test: http://localhost:${PORT}/test-api`);
});