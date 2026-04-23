#!/bin/bash

echo "🚀 Démarrage de l'application sur Render..."

# 1. Désactiver les proxys
unset HTTP_PROXY
unset HTTPS_PROXY
unset http_proxy
unset https_proxy
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo "✅ Proxy désactivé"

# 2. Exécuter le diagnostic rapide (optionnel)
if [ -f "diagnostic.js" ]; then
    echo "🔍 Exécution du diagnostic rapide..."
    timeout 30 node diagnostic.js || echo "⚠️ Diagnostic interrompu (timeout)"
fi

# 3. Mettre à jour le token si nécessaire
if [ -f "scripts/fix-for-render.js" ]; then
    echo "🔑 Mise à jour du token..."
    node scripts/fix-for-render.js
fi

# 4. Démarrer le serveur
echo "🌐 Démarrage du serveur..."
node server.js