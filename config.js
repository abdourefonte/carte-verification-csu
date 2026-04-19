// config.js - MANUEL (avec token valide jusqu'en avril 2027)
// Dernière mise à jour: 2026-04-19

module.exports = {
  getToken: () => {
    return 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfVVNFUiIsImV4cCI6MTc3NjcxNjE5N30.kI-hJNRaiBd_oZ4_6MBLBLG32CtC0X-sH0PZJUgHtlTgHL_OdGu9cv84OpW24Fwc81XWce7aTolyi4mtW3sb7A';
  },
  
  getTokenInfo: () => {
    return {
      lastUpdate: new Date().toISOString(),
      tokenPreview: 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfV...',
      expiresIn: '1 an (avril 2027)'
    };
  }
};