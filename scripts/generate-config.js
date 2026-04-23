const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function generateConfig() {
  console.log('🔑 Génération du fichier config.js pour Render...');
  
  try {
    // 1. Récupérer un nouveau token
    console.log('📡 Connexion à l\'API d\'authentification...');
    const response = await axios.post(
      'https://mdamsigicmu.sec.gouv.sn/api/authenticate',
      {
        username: 'caisse_sencsu',
        password: 'passer'
      },
      {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 30000
      }
    );

    const token = response.data.id_token;
    console.log('✅ Token obtenu avec succès');
    console.log('🔑 Token preview:', token.substring(0, 50) + '...');

    // 2. Créer le contenu du fichier config.js
    const configContent = `// config.js - GÉNÉRÉ AUTOMATIQUEMENT POUR RENDER
// Date de génération: ${new Date().toISOString()}
// Ce fichier est régénéré à chaque déploiement sur Render

module.exports = {
  getToken: () => {
    return 'Bearer ${token}';
  },
  
  getTokenInfo: () => {
    return {
      lastUpdate: '${new Date().toISOString()}',
      tokenPreview: '${token.substring(0, 50)}...',
      expiresIn: '5 heures (prochaine mise à jour automatique)',
      generatedBy: 'Render deploy script'
    };
  }
};
`;

    // 3. Écrire le fichier
    const configPath = path.join(__dirname, '../config.js');
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('✅ Fichier config.js créé avec succès');
    console.log('📁 Emplacement:', configPath);

    // 4. Vérifier que le fichier est lisible
    if (fs.existsSync(configPath)) {
      const config = require('../config.js');
      const testToken = config.getToken();
      console.log('✅ Vérification: le fichier est valide et contient un token de', testToken.length, 'caractères');
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la génération de config.js:', error.message);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  console.log('🚀 Script de génération de config pour Render\n');
  generateConfig();
}

module.exports = generateConfig;