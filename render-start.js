// render-start.js - Point d'entrée pour Render
const { execSync } = require('child_process');

console.log('🚀 DÉMARRAGE DE L\'APPLICATION SUR RENDER');
console.log('=========================================\n');

try {
  // 1. Générer le fichier config.js avec un token frais
  console.log('📝 Étape 1: Génération du fichier de configuration...');
  require('./scripts/generate-config');
  
  // 2. Vérifier que le build Angular existe
  const fs = require('fs');
  const path = require('path');
  const distPath = path.join(__dirname, 'dist/carte-verification/browser');
  
  if (!fs.existsSync(distPath)) {
    console.log('⚠️ Build Angular non trouvé, tentative de build...');
    try {
      execSync('npx ng build --configuration production', { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes timeout
      });
      console.log('✅ Build Angular terminé');
    } catch (buildError) {
      console.error('❌ Erreur lors du build Angular:', buildError.message);
      console.log('⚠️ Démarrage sans le frontend Angular');
    }
  } else {
    console.log('✅ Build Angular trouvé');
  }
  
  // 3. Démarrer le serveur
  console.log('\n🌐 Étape 2: Démarrage du serveur Express...');
  require('./server.js');
  
} catch (error) {
  console.error('❌ Erreur fatale au démarrage:', error.message);
  process.exit(1);
}