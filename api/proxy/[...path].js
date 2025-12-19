// api/proxy/[...path].js
const API_URL = 'https://mdamsigicmu.sec.gouv.sn/services/udam/api';
const TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfVVNFUiIsImV4cCI6MTc2NjIyNzIxMH0.tVuo-RaQIzb0Dsly9FHfe9yDaeNYMj8fYQPhuOsvNO3l_N67_QYYLDpdvFPvkppvFOym8-J_GxEL2fzaH2eSvA';

export default async function handler(req, res) {
  const { path } = req.query;

  // Gérer CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Construire l'URL cible
    const pathString = Array.isArray(path) ? path.join('/') : path;
    
    // Extraire les autres paramètres de requête
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'path' && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.set(key, value);
        }
      }
    }
    
    const queryString = queryParams.toString();
    const targetUrl = `${API_URL}/${pathString}${queryString ? `?${queryString}` : ''}`;
    
    console.log('Proxying to:', targetUrl);

    // Faire la requête à l'API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });

    // Vérifier la réponse
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    // Lire la réponse
    const data = await response.json();
    
    // Retourner la réponse nettoyée
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}