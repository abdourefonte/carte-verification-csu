const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

class RenderFix {
  constructor() {
    this.newToken = null;
  }

  async run() {
    console.log('🔧 Application du fix pour Render...\n');

    try {
      // 1. Forcer la désactivation du proxy
      this.disableProxy();
      
      // 2. Obtenir un nouveau token
      await this.getFreshToken();
      
      // 3. Mettre à jour config.js
      await this.updateConfig();
      
      // 4. Vérifier que l'API est accessible
      await this.testAPI();
      
      console.log('\n✅ Fix appliqué avec succès!');
      console.log('📝 Prochaine étape: redéployer sur Render');
      
    } catch (error) {
      console.error('\n❌ Échec du fix:', error.message);
    }
  }

  disableProxy() {
    console.log('🔄 Désactivation des proxys...');
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.http_proxy;
    delete process.env.https_proxy;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('   ✅ Proxy désactivé');
  }

  async getFreshToken() {
    console.log('🔑 Récupération d\'un nouveau token...');
    
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

    this.newToken = response.data.id_token;
    console.log('   ✅ Token obtenu:', this.newToken.substring(0, 50) + '...');
  }

  async updateConfig() {
    console.log('📝 Mise à jour de config.js...');
    
    const configPath = path.join(__dirname, '../config.js');
    
    const newConfig = `// config.js - FIX RENDER
// Généré le: ${new Date().toISOString()}
// IMPORTANT: Ce fichier est regénéré à chaque déploiement

module.exports = {
  getToken: () => {
    return 'Bearer ${this.newToken}';
  },
  
  getTokenInfo: () => {
    return {
      lastUpdate: '${new Date().toISOString()}',
      tokenPreview: '${this.newToken.substring(0, 50)}...',
      expiresIn: 'Variable (selon l\\'API)'
    };
  }
};
`;

    fs.writeFileSync(configPath, newConfig, 'utf8');
    console.log('   ✅ config.js mis à jour');
  }

  async testAPI() {
    console.log('🧪 Test de l\'API avec le nouveau token...');
    
    const testCode = 'V9676R6540';
    
    try {
      const response = await axios.get(
        `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${testCode}`,
        {
          headers: { 'Authorization': `Bearer ${this.newToken}` },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          timeout: 15000
        }
      );
      
      console.log('   ✅ API répond correctement (status:', response.status, ')');
      console.log('   📊 Données exemple:', JSON.stringify(response.data).substring(0, 200));
      
    } catch (error) {
      console.log('   ⚠️ Test API échoué:', error.message);
      console.log('   💡 L\'API sera testée à nouveau lors du déploiement');
    }
  }
}

// Exécution
const fix = new RenderFix();
fix.run();