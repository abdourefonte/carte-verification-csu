// api/beneficiaire.js
export default async function handler(req, res) {
  // Configurer CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Gérer les pré-requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Seulement GET accepté
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Code manquant' });
    }
    
    const apiUrl = `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${code}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfVVNFUiIsImV4cCI6MTc2NjIzNDUwNX0.FVsVZmwRIL8u60bbTuQXzf9HcMG9DpLQqNbc4URjBjqXKvejncyehlrl2zZqEm8D0cgmPboi57431MfcDrNhtw',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('❌ Erreur proxy:', error);
    return res.status(500).json({ 
      error: error.message || 'Erreur serveur' 
    });
  }
}