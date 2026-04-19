const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');

const app = express();
app.use(cors());

// Liste de proxies publics (testés)
const PROXIES = [
  'http://proxy-nairobi.xyz:8080',
  'http://103.169.142.0:8080',
  'http://41.77.188.165:8080',
  'http://154.113.113.70:8080',
];

let currentProxyIndex = 0;

function getNextProxy() {
  currentProxyIndex = (currentProxyIndex + 1) % PROXIES.length;
  return PROXIES[currentProxyIndex];
}

app.get('/api/beneficiairess/codeImmatriculation', async (req, res) => {
  try {
    const { code } = req.query;
    const token = require('./config').getToken();
    const proxyUrl = getNextProxy();
    
    console.log(`🔍 Utilisation du proxy: ${proxyUrl}`);
    
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    
    const response = await axios({
      method: 'GET',
      url: `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${code}`,
      headers: { 
        'Authorization': token,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      httpsAgent: proxyAgent,
      timeout: 30000,
      proxy: false // Important pour éviter conflit
    });
    
    console.log(`✅ Succès via proxy ${proxyUrl}`);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      proxy: getNextProxy()
    });
  }
});

// Servir Angular
app.use(express.static(path.join(__dirname, 'dist/carte-verification/browser')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/carte-verification/browser/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));