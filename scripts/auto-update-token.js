// scripts/auto-update-token.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TokenAutoUpdater {
  constructor() {
    this.authUrl = 'https://mdamsigicmu.sec.gouv.sn/api/authenticate';
    this.credentials = {
      username: 'caisse_sencsu',
      password: 'passer'
    };
    this.configFile = path.join(__dirname, '../config.js');
    this.commitMessage = 'Auto-update: Token JWT renouvelé';
  }

  async run() {
    console.log('🔄 Démarrage de la mise à jour automatique du token...');
    
    try {
      // 1. Récupérer un nouveau token
      const newToken = await this.fetchNewToken();
      console.log('✅ Nouveau token obtenu');
      
      // 2. Mettre à jour config.js
      await this.updateConfigFile(newToken);
      console.log('✅ Fichier config.js mis à jour');
      
      // 3. Git operations
      this.gitAddCommitPush();
      console.log('✅ Changements poussés sur GitHub');
      
      // 4. Log de succès
      this.logSuccess(newToken);
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error.message);
      process.exit(1);
    }
  }

  async fetchNewToken() {
    console.log('🔐 Connexion à l\'API d\'authentification...');
    
    const response = await axios.post(this.authUrl, this.credentials);
    
    if (!response.data || !response.data.id_token) {
      throw new Error('Token non trouvé dans la réponse');
    }
    
    return response.data.id_token;
  }

  async updateConfigFile(token) {
    const newConfig = `// config.js - AUTO-GENERATED
// Dernière mise à jour: ${new Date().toISOString()}

module.exports = {
  getToken: () => {
    return 'Bearer ${token}';
  },
  
  getTokenInfo: () => {
    return {
      lastUpdate: '${new Date().toISOString()}',
      tokenPreview: '${token.substring(0, 50)}...',
      expiresIn: '5 heures (prochaine mise à jour automatique)'
    };
  }
};
`;

    fs.writeFileSync(this.configFile, newConfig, 'utf8');
  }

  gitAddCommitPush() {
    try {
      // Ajouter config.js
      execSync('git add config.js', { stdio: 'inherit' });
      
      // Commit avec message
      execSync(`git commit -m "${this.commitMessage}"`, { stdio: 'inherit' });
      
      // Push vers GitHub
      execSync('git push origin main', { stdio: 'inherit' });
      
    } catch (error) {
      console.warn('⚠️ Git operation non critique:', error.message);
    }
  }

  logSuccess(token) {
    const logEntry = `
======================================
✅ TOKEN MIS À JOUR AUTOMATIQUEMENT
======================================
Date: ${new Date().toISOString()}
Token: ${token.substring(0, 50)}...
Prochaine mise à jour: ${new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()}
======================================

`;
    
    // Écrire dans un fichier log
    const logFile = path.join(__dirname, '../token-update.log');
    fs.appendFileSync(logFile, logEntry, 'utf8');
    
    console.log(logEntry);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const updater = new TokenAutoUpdater();
  updater.run();
}

module.exports = TokenAutoUpdater;