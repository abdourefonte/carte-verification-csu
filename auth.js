// auth.js - Gestion automatique du token
const axios = require('axios');

class AuthManager {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshQueue = [];
  }

  /**
   * Obtenir un token frais depuis l'API
   */
  async fetchNewToken() {
    try {
      console.log('🔄 Tentative d\'authentification...');
      
      const response = await axios.post(
        'https://mdamsigicmu.sec.gouv.sn/api/authenticate',
        {
          username: process.env.API_USERNAME || 'caisse_sencsu',
          password: process.env.API_PASSWORD || 'passer'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.token) {
        const token = response.data.token;
        
        // Décoder le JWT pour connaître sa date d'expiration
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const expiry = payload.exp * 1000; // Convertir en millisecondes
        
        this.token = token;
        this.tokenExpiry = expiry;
        
        console.log('✅ Token obtenu avec succès');
        console.log(`⏰ Expire le: ${new Date(expiry).toLocaleString()}`);
        
        return token;
      } else {
        throw new Error('Token non trouvé dans la réponse');
      }
    } catch (error) {
      console.error('❌ Erreur d\'authentification:', error.message);
      
      // Utiliser un token de secours si configuré
      if (process.env.FALLBACK_TOKEN) {
        console.log('⚠️ Utilisation du token de secours');
        this.token = process.env.FALLBACK_TOKEN;
        this.tokenExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 jours
        return this.token;
      }
      
      throw error;
    }
  }

  /**
   * Obtenir le token courant (rafraîchir si nécessaire)
   */
  async getCurrentToken() {
    // Si pas de token ou expire dans moins de 5 minutes
    if (!this.token || !this.tokenExpiry || this.tokenExpiry - Date.now() < 300000) {
      console.log('🔄 Token expiré ou absent, rafraîchissement...');
      return await this.fetchNewToken();
    }
    
    return this.token;
  }

  /**
   * Démarrer le rafraîchissement automatique
   */
  startAutoRefresh() {
    // Rafraîchir toutes les 50 minutes
    setInterval(async () => {
      try {
        console.log('🔄 Rafraîchissement périodique du token...');
        await this.fetchNewToken();
      } catch (error) {
        console.error('⚠️ Échec du rafraîchissement automatique:', error.message);
      }
    }, 50 * 60 * 1000); // 50 minutes
    
    console.log('✅ Rafraîchissement automatique activé (toutes les 50 minutes)');
  }
}

// Exporter une instance unique
module.exports = new AuthManager();