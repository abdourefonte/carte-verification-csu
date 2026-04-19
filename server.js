// server.js - Version simplifiée sans http-proxy-middleware
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Endpoint API direct avec axios
app.get('/api/beneficiairess/codeImmatriculation', async (req, res) => {
  try {
    const { code } = req.query;
    const token = require('./config').getToken();
    
    const response = await axios.get(
      `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${code}`,
      {
        headers: { 'Authorization': token },
        timeout: 15000,
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      code: error.code 
    });
  }
});

// Servir Angular
app.use(express.static(path.join(__dirname, 'dist/carte-verification/browser')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/carte-verification/browser/index.html'));
});

app.listen(3000);