const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

class DiagnosticComplet {
  constructor() {
    this.results = {
      environnement: {},
      reseau: {},
      api: {},
      token: {},
      proxy: {}
    };
    this.logFile = path.join(__dirname, 'diagnostic-report.json');
  }

  async run() {
    console.log('🔬 DÉMARRAGE DU DIAGNOSTIC COMPLET');
    console.log('====================================\n');

    try {
      await this.checkEnvironnement();
      await this.checkReseau();
      await this.checkProxySettings();
      await this.checkAPIAuth();
      await this.checkTokenValidity();
      await this.testAPIFull();
      
      this.printSummary();
      this.saveReport();
      
      console.log('\n✅ Diagnostic terminé. Rapport sauvegardé dans:', this.logFile);
      
    } catch (error) {
      console.error('❌ Erreur critique pendant le diagnostic:', error.message);
    }
  }

  async checkEnvironnement() {
    console.log('📋 1. Vérification de l\'environnement...');
    this.results.environnement = {
      node_version: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      env_vars: {
        PORT: process.env.PORT || 'non défini',
        NODE_ENV: process.env.NODE_ENV || 'non défini',
        RENDER: process.env.RENDER || 'non défini',
        WEB_CONCURRENCY: process.env.WEB_CONCURRENCY || 'non défini'
      },
      files: {
        config_exists: fs.existsSync(path.join(__dirname, '../config.js')),
        auto_update_exists: fs.existsSync(path.join(__dirname, 'auto-update-token.js')),
        dist_exists: fs.existsSync(path.join(__dirname, '../dist'))
      }
    };
    
    console.log('   ✅ Node version:', process.version);
    console.log('   📁 Config file exists:', this.results.environnement.files.config_exists);
  }

  async checkReseau() {
    console.log('\n🌐 2. Vérification réseau...');
    
    try {
      // Test connexion générale
      const start = Date.now();
      await axios.get('https://www.google.com', { timeout: 5000 });
      const latency = Date.now() - start;
      
      this.results.reseau.internet_access = true;
      this.results.reseau.latency_ms = latency;
      console.log('   ✅ Internet accessible (latence:', latency, 'ms)');
      
    } catch (error) {
      this.results.reseau.internet_access = false;
      this.results.reseau.error = error.message;
      console.log('   ❌ Pas d\'accès Internet:', error.message);
    }

    // Test DNS
    try {
      const dns = require('dns').promises;
      await dns.lookup('mdamsigicmu.sec.gouv.sn');
      this.results.reseau.dns_resolution = true;
      console.log('   ✅ DNS résout mdamsigicmu.sec.gouv.sn');
    } catch (error) {
      this.results.reseau.dns_resolution = false;
      console.log('   ❌ DNS ne résout pas l\'API');
    }
  }

  async checkProxySettings() {
    console.log('\n🔄 3. Vérification des paramètres proxy...');
    
    this.results.proxy = {
      HTTP_PROXY: process.env.HTTP_PROXY || 'non défini',
      HTTPS_PROXY: process.env.HTTPS_PROXY || 'non défini',
      http_proxy: process.env.http_proxy || 'non défini',
      https_proxy: process.env.https_proxy || 'non défini',
      NO_PROXY: process.env.NO_PROXY || 'non défini',
      node_tls_reject_unauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'non défini'
    };
    
    const hasProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || 
                     process.env.http_proxy || process.env.https_proxy;
    
    if (hasProxy) {
      console.log('   ⚠️ Proxy détecté:', hasProxy);
      console.log('   ⚠️ Le proxy peut bloquer les requêtes vers l\'API CSU');
    } else {
      console.log('   ✅ Aucun proxy configuré');
    }
  }

  async checkAPIAuth() {
    console.log('\n🔑 4. Test d\'authentification API...');
    
    const authUrl = 'https://mdamsigicmu.sec.gouv.sn/api/authenticate';
    const credentials = {
      username: 'caisse_sencsu',
      password: 'passer'
    };

    try {
      const response = await axios.post(authUrl, credentials, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 15000,
        validateStatus: false // Accepte tous les status
      });

      console.log('   📡 Status HTTP:', response.status);
      console.log('   📡 Headers:', JSON.stringify(response.headers, null, 2).substring(0, 200));

      if (response.data && response.data.id_token) {
        this.results.api.auth_success = true;
        this.results.api.token_preview = response.data.id_token.substring(0, 50) + '...';
        this.newToken = response.data.id_token;
        console.log('   ✅ Authentification réussie');
        console.log('   🔑 Token preview:', this.results.api.token_preview);
      } else {
        this.results.api.auth_success = false;
        this.results.api.auth_error = 'Token non trouvé dans la réponse';
        this.results.api.response_data = JSON.stringify(response.data).substring(0, 200);
        console.log('   ❌ Échec auth: Token absent de la réponse');
      }

    } catch (error) {
      this.results.api.auth_success = false;
      this.results.api.auth_error = error.message;
      this.results.api.auth_code = error.code;
      
      console.log('   ❌ Erreur auth:', error.message);
      if (error.response) {
        console.log('   📡 Status:', error.response.status);
        console.log('   📡 Data:', JSON.stringify(error.response.data).substring(0, 200));
      }
    }
  }

  async checkTokenValidity() {
    console.log('\n🎫 5. Vérification du token actuel dans config.js...');
    
    try {
      const config = require('../config.js');
      const token = config.getToken();
      
      if (token && token.startsWith('Bearer ')) {
        const tokenValue = token.replace('Bearer ', '');
        
        // Décoder le payload JWT
        try {
          const payload = JSON.parse(
            Buffer.from(tokenValue.split('.')[1], 'base64').toString()
          );
          
          const now = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp < now;
          const remaining = payload.exp - now;
          
          this.results.token = {
            valid_format: true,
            expired: isExpired,
            expiration_date: new Date(payload.exp * 1000).toISOString(),
            remaining_seconds: remaining,
            remaining_hours: Math.floor(remaining / 3600),
            subject: payload.sub,
            authority: payload.auth
          };
          
          if (isExpired) {
            console.log('   ❌ Token EXPIRÉ depuis:', Math.abs(Math.floor(remaining / 3600)), 'heures');
          } else {
            console.log('   ✅ Token valide pour encore', Math.floor(remaining / 3600), 'heures');
          }
          
        } catch (decodeError) {
          this.results.token = {
            valid_format: false,
            error: 'Impossible de décoder le token'
          };
          console.log('   ⚠️ Token format invalide');
        }
        
      } else {
        this.results.token = { valid_format: false, error: 'Token absent ou mal formaté' };
        console.log('   ❌ Token absent ou mal formaté dans config.js');
      }
      
    } catch (error) {
      this.results.token = { error: error.message };
      console.log('   ❌ Erreur lecture config.js:', error.message);
    }
  }

  async testAPIFull() {
    console.log('\n🎯 6. Test complet de l\'API bénéficiaire...');
    
    const testCode = 'V9676R6540';
    const token = this.newToken || (() => {
      try {
        return require('../config.js').getToken().replace('Bearer ', '');
      } catch { return null; }
    })();

    if (!token) {
      this.results.api.full_test = { success: false, error: 'Pas de token disponible' };
      console.log('   ❌ Impossible de tester: pas de token');
      return;
    }

    // Test URLs multiples pour trouver la bonne
    const urls = [
      `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${testCode}`,
      `https://mdamsigicmu.sec.gouv.sn/api/beneficiairess/codeImmatriculation?code=${testCode}`,
      `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiaires/codeImmatriculation?code=${testCode}`,
      `https://mdamsigicmu.sec.gouv.sn/api/beneficiaires/codeImmatriculation?code=${testCode}`
    ];

    for (const url of urls) {
      try {
        console.log(`   🔄 Test URL: ${url.substring(0, 80)}...`);
        
        const response = await axios.get(url, {
          headers: { 'Authorization': `Bearer ${token}` },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          timeout: 15000,
          validateStatus: false
        });

        console.log(`   📡 Status: ${response.status}`);
        
        if (response.status === 200) {
          this.results.api.full_test = {
            success: true,
            working_url: url,
            status: response.status,
            has_data: !!response.data,
            data_type: typeof response.data
          };
          console.log('   ✅ SUCCÈS! URL fonctionnelle trouvée:', url);
          console.log('   📊 Données reçues:', JSON.stringify(response.data).substring(0, 100));
          return;
        } else {
          console.log(`   ⚠️ Status ${response.status} pour cette URL`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erreur pour cette URL:`, error.message);
        if (error.response) {
          console.log(`   📡 Status:`, error.response.status);
        }
      }
    }

    this.results.api.full_test = {
      success: false,
      error: 'Aucune URL n\'a fonctionné'
    };
    console.log('   ❌ Aucune URL n\'a retourné 200');
  }

  printSummary() {
    console.log('\n\n📊 RÉSUMÉ DU DIAGNOSTIC');
    console.log('=======================');
    
    const checks = [
      { label: 'Environnement Node', pass: this.results.environnement.node_version !== undefined },
      { label: 'Accès Internet', pass: this.results.reseau.internet_access },
      { label: 'DNS API CSU', pass: this.results.reseau.dns_resolution },
      { label: 'Authentification API', pass: this.results.api.auth_success },
      { label: 'Token valide', pass: this.results.token.valid_format && !this.results.token.expired },
      { label: 'API Bénéficiaire', pass: this.results.api.full_test?.success },
      { label: 'Présence proxy', pass: !this.results.proxy.HTTP_PROXY }
    ];

    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`${icon} ${check.label}`);
    });

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    if (!this.results.api.auth_success) {
      console.log('   1. Vérifiez que l\'API CSU est accessible depuis Render');
      console.log('   2. Les credentials ont peut-être changé');
    }
    if (this.results.proxy.HTTP_PROXY) {
      console.log('   3. Désactivez le proxy dans le start script ou via variables d\'environnement Render');
    }
    if (this.results.token.expired) {
      console.log('   4. Le token est expiré - l\'auto-update ne fonctionne pas sur Render');
      console.log('   5. Solution: Générez un token longue durée ou implémentez un cron job');
    }
    if (!this.results.api.full_test?.success) {
      console.log('   6. L\'URL de l\'API a peut-être changé');
      console.log('   7. Contactez l\'administrateur de l\'API CSU');
    }
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      render_detected: !!process.env.RENDER,
      results: this.results
    };
    
    fs.writeFileSync(this.logFile, JSON.stringify(report, null, 2));
  }
}

// Exécution
if (require.main === module) {
  console.log('🔍 Diagnostic d\'urgence pour Render\n');
  const diagnostic = new DiagnosticComplet();
  diagnostic.run();
}

module.exports = DiagnosticComplet;