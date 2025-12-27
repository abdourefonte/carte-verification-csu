// tokenRefresh.js - Script de rafraîchissement périodique
const authService = require('./authService');

async function refreshTokenPeriodically() {
  const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  
  console.log('🔄 Démarrage du rafraîchissement périodique du token');
  
  async function refresh() {
    try {
      // Rafraîchir le token avant son expiration
      if (authService.isTokenExpired()) {
        console.log('🔄 Token expiré, rafraîchissement...');
      } else {
        console.log('🔄 Rafraîchissement préventif du token...');
      }
      
      await authService.fetchNewToken();
      console.log('✅ Token rafraîchi avec succès');
    } catch (error) {
      console.error('❌ Échec du rafraîchissement:', error.message);
    }
  }
  
  // Exécuter immédiatement
  await refresh();
  
  // Puis périodiquement
  setInterval(refresh, REFRESH_INTERVAL);
  
  // Vérifier toutes les minutes si le token est sur le point d'expirer
  setInterval(() => {
    if (authService.isTokenExpired()) {
      console.log('⚠️ Token expiré, rafraîchissement nécessaire');
    }
  }, 60 * 1000);
}

// Démarrer si exécuté directement
if (require.main === module) {
  refreshTokenPeriodically();
}

module.exports = refreshTokenPeriodically;