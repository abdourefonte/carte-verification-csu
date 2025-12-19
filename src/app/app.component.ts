import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Beneficiaire, TypeBeneficiaire } from './services/api.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-root',
  template: `
  <!-- Header -->
<header class="bg-white shadow-sm py-3">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-md-2 text-center">
        <img src="assets/flag-senegal.webp" alt="Logo CSU" height="60">
      </div>
      <div class="col-md-8 text-center">
        <h1 class="h4 mb-1 text-primary">COUVERTURE SANITAIRE UNIVERSELLE</h1>
        <p class="mb-0 text-muted"><small>République du Sénégal</small></p>
      </div>
      <div class="col-md-2 text-center">
        <img src="assets/flag-senegal.webp" alt="Drapeau Sénégal" height="40">
      </div>
    </div>
  </div>
</header>

<!-- Main Content -->
<main class="py-4">
  <div class="container">
    
    <!-- Loading State -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
      <h3 class="mt-3">Chargement...</h3>
    </div>

    <!-- Error State -->
    <div *ngIf="error" class="alert alert-danger text-center">
      <h4><i class="fas fa-exclamation-triangle"></i> Erreur</h4>
      <p>{{ errorMessage }}</p>
      <button class="btn btn-outline-danger" (click)="reloadPage()">
        Réessayer
      </button>
    </div>

    <!-- Welcome Page (no code) -->
    <div *ngIf="!loading && !error && !beneficiaire" class="text-center py-5">
      <div class="card shadow">
        <div class="card-body p-5">
          <i class="fas fa-qr-code display-1 text-primary mb-4"></i>
          <h2 class="mb-3">Vérification Carte Bénéficiaire</h2>
          <p class="text-muted mb-4">
            Scannez un QR code de carte CSU pour vérifier sa validité
          </p>
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            Cette page s'ouvre automatiquement lorsqu'un QR code est scanné
          </div>
        </div>
      </div>
    </div>

    <!-- Beneficiary Card -->
    <div *ngIf="!loading && !error && beneficiaire" class="card shadow-lg">
      
      <!-- Card Header -->
      <div class="card-header" [ngClass]="{'bg-success': isCardValid(), 'bg-danger': !isCardValid()}">
        <div class="row align-items-center">
          <div class="col-md-8 text-white">
            <h3 class="mb-1">
              <i class="fas" [ngClass]="{'fa-check-circle': isCardValid(), 'fa-times-circle': !isCardValid()}"></i>
              {{ isCardValid() ? 'CARTE VALIDE' : 'CARTE EXPIRÉE' }}
            </h3>
            <small>Vérifié le {{ today | date:'dd/MM/yyyy à HH:mm' }}</small>
          </div>
          <div class="col-md-4 text-end">
            <button class="btn btn-light btn-sm me-2" (click)="printPage()">
              <i class="fas fa-print"></i> Imprimer
            </button>
            <button class="btn btn-light btn-sm" (click)="sharePage()">
              <i class="fas fa-share-alt"></i> Partager
            </button>
          </div>
        </div>
      </div>

      <!-- Card Body -->
      <div class="card-body p-4">
        
        <!-- Identity Section -->
        <div class="row mb-4">
          <div class="col-md-3 text-center">
            <!-- Photo -->
            <div class="mb-3">
              <div *ngIf="beneficiaire.photo" class="rounded-circle mx-auto overflow-hidden"
                   style="width: 120px; height: 120px;">
                <img [src]="getPhotoUrl()" alt="Photo" class="img-fluid h-100 w-100">
              </div>
              <div *ngIf="!beneficiaire.photo" class="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto"
                   style="width: 120px; height: 120px;">
                <i class="fas fa-user fs-1 text-muted"></i>
              </div>
            </div>
            
            <!-- Matricule -->
            <div class="mb-3">
              <span class="badge bg-primary fs-6 p-2">
                {{ beneficiaire.codeImmatriculation }}
              </span>
            </div>
            
            <!-- QR Code -->

          </div>

          <div class="col-md-9">
            <h2 class="mb-3">
              {{ beneficiaire.prenom }} {{ beneficiaire.nom }}
              <small class="text-muted">({{ getAge() }} ans)</small>
            </h2>
            
            <div class="row">
              <div class="col-md-6">
               <div>
                      <p><strong>Code assuré:</strong> {{ beneficiaire.code || 'N/A' }}</p>
                    </div>
                <p><strong>Sexe:</strong> {{ beneficiaire.sexe }}</p>
                
                <p><strong>CNI:</strong> {{ beneficiaire.numeroPiece || 'N/A' }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Date naissance:</strong> {{ formatDate(beneficiaire.dateNaissance) }}</p>
                <p><strong>Lieu naissance:</strong> {{ beneficiaire.lieuNaissance || 'N/A' }}</p>
                <p><strong>Statut:</strong> 
                  <span class="badge" [ngClass]="{
                    'bg-success': beneficiaire.etat === 'Active',
                    'bg-warning': beneficiaire.etat === 'SUSPENDRE',
                    'bg-danger': beneficiaire.etat === 'BLOQUER'
                  }">
                    {{ beneficiaire.etat }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- NOUVELLE SECTION: Informations Personnelles Détaillées -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card card-body bg-light">
              <h4 class="border-bottom pb-2 mb-3">
                <i class="fas fa-id-card text-primary me-2"></i>Informations Personnelles
              </h4>
              
              <div class="row">
                <!-- Colonne 1 -->
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="text-muted small mb-1">Type de Pièce</label>
                    <p class="mb-0 fw-bold">{{ beneficiaire.typePiece || 'CNI' }}</p>
                  </div>
                  <div class="mb-3">
                    <label class="text-muted small mb-1">Relation au Titulaire</label>
                    <p class="mb-0 fw-bold">{{ getRelationLibelle() }}</p>
                  </div>
                  <div class="mb-3">
                    <label class="text-muted small mb-1">Email</label>
                    <p class="mb-0 fw-bold">{{ beneficiaire.email || 'Non renseigné' }}</p>
                  </div>
                </div>
                
                <!-- Colonne 2 -->
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="text-muted small mb-1">Titulaire de l'Adhésion</label>
                    <p class="mb-0 fw-bold">{{ getTitulaireNomComplet() }}</p>
                    <small class="text-muted">{{ beneficiaire.titulaire?.telephone || '' }}</small>
                  </div>
                  <div class="mb-3">
                    <label class="text-muted small mb-1">Type de Bénéficiaire</label>
                    <p class="mb-0 fw-bold">{{ getTypeBeneficiaireLibelle() }}</p>
                    <small class="text-muted">Catégorie: {{ getCategorieLibelle() }}</small>
                  </div>
                </div>
                
                <!-- Colonne 3 -->
                <div class="col-md-4">
                  
                  <div class="mb-3">
                    <label class="text-muted small mb-1">Date d'Enregistrement</label>
                    <p class="mb-0 fw-bold">{{ beneficiaire.dateInsert ? formatDateTime(beneficiaire.dateInsert) : 'N/A' }}</p>
                  </div>
                  <div class="mb-3">
                    <label class="text-muted small mb-1">Adhérent</label>
                    <span class="badge" [ngClass]="beneficiaire.adherent ? 'bg-success' : 'bg-warning'">
                      {{ beneficiaire.adherent ? 'OUI' : 'NON' }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Informations Adhésion -->
              <div class="mt-3 pt-3 border-top">
                <div class="row">
                  <div class="col-md-6">
                    <label class="text-muted small mb-1">Dénomination Famille</label>
                    <p class="mb-0 fw-bold">{{ beneficiaire.adhesion?.denomination || 'N/A' }}</p>
                    <small class="text-muted">Type: {{ beneficiaire.adhesion?.adhesionType || 'FAMILLE' }}</small>
                  </div>
                  <div class="col-md-6">
                    <label class="text-muted small mb-1">Paiement</label>
                    <div class="d-flex align-items-center">
                      <span class="badge me-2" [ngClass]="beneficiaire.adhesion?.estPaye ? 'bg-success' : 'bg-danger'">
                        {{ beneficiaire.adhesion?.estPaye ? 'PAYÉ' : 'NON PAYÉ' }}
                      </span>
                      <small class="text-muted">
                        Cotisation: {{ getMontantCotisation() }} FCFA
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div> <!-- Fermeture de la div.card card-body bg-light -->
          </div> <!-- Fermeture de la div.col-12 -->
        </div> <!-- Fermeture de la div.row mb-4 -->

        <!-- Address Section -->
        <div class="row mb-4">
          <div class="col-12">
            <h4 class="border-bottom pb-2">
              <i class="fas fa-home text-primary me-2"></i>Adresse
            </h4>
            <div class="row">
              <div class="col-md-4">
                <p><strong>Adresse:</strong><br>{{ beneficiaire.adresse || 'N/A' }}</p>
              </div>
              <div class="col-md-4">
                <p><strong>Région:</strong><br>{{ beneficiaire.region || getRegionName(beneficiaire.regionId) || 'N/A' }}</p>
              </div>
              <div class="col-md-4">
                <p><strong>Département:</strong><br>{{ beneficiaire.departement || getDepartementName(beneficiaire.departementId) || 'N/A' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Affiliation Section -->
        <div class="row mb-4">
          <div class="col-12">
            <h4 class="border-bottom pb-2">
              <i class="fas fa-users text-primary me-2"></i>Informations d'affiliation
            </h4>
            <div class="row">
           <div class="col-md-3">
                      <p> <strong>Date adhésion:</strong><br>  {{beneficiaire?.adhesion?.dateAdhesion 
      ? formatDated(beneficiaire.adhesion?.dateAdhesion)
      : 'N/A' }}
  </p>
                  </div>
              <div class="col-md-3">
                <p><strong>Régime:</strong><br>Contributif</p>
              </div>
             
              <div class="col-md-3">
                <p><strong>Type adhésion:</strong><br>{{ beneficiaire.adhesion?.adhesionType || beneficiaire.typeAdhesion || 'Famille' }}</p>
              </div>
             <div class="col-md-3">
                    <p><strong>Type bénéficiaire:</strong><br>{{ getCategorieTypeBeneficiaire() }}</p>
                  </div>
                
            </div>
            <div class="row mt-3">
              <div class="col-md-4">
                <p><strong>Paquet de soins:</strong><br>{{ getPaquetSoinLibelle() }}</p>
              </div>
              <div class="col-md-4">
                <p><strong>Taux couverture:</strong><br>{{ getTauxCouverture() }}%</p>
              </div>
              <div class="col-md-4">
                <p><strong>Date enregistrement:</strong><br>{{ beneficiaire.dateInsert ? formatDate(beneficiaire.dateInsert) : 'N/A' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Coverage Period -->
        <div class="row">
          <div class="col-12">
            <h4 class="border-bottom pb-2">
              <i class="fas fa-calendar-check text-primary me-2"></i>Période de couverture
            </h4>
            <div class="row align-items-center">
              <div class="col-md-4">
                <p><strong>Date début:</strong><br>{{ beneficiaire.dateDebutc ? formatDate(beneficiaire.dateDebutc) : 'N/A' }}</p>
              </div>
              <div class="col-md-4">
                <p><strong>Date fin:</strong><br>{{ beneficiaire.dateFinc ? formatDate(beneficiaire.dateFinc) : 'N/A' }}</p>
              </div>
              <div class="col-md-4 text-center">
                <div class="d-flex align-items-center justify-content-center">
                  <div class="me-3">
                    <div class="fs-4 fw-bold">{{ getDaysRemaining() }}</div>
                    <small class="text-muted">jours restants</small>
                  </div>
                  <div [ngClass]="{'text-success': isCardValid(), 'text-danger': !isCardValid()}">
                    <i class="fas" [ngClass]="{'fa-check-circle fa-3x': isCardValid(), 'fa-times-circle fa-3x': !isCardValid()}"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="mt-3">
              <div class="progress" style="height: 25px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated"
                     [ngClass]="{'bg-success': isCardValid(), 'bg-danger': !isCardValid()}"
                     [style.width]="getProgress() + '%'">
                  {{ getProgress().toFixed(1) }}%
                </div>
              </div>
              <div class="d-flex justify-content-between mt-2">
                <small>{{ beneficiaire.dateDebutc ? formatDate(beneficiaire.dateDebutc) : 'N/A' }}</small>
                <small>{{ beneficiaire.dateFinc ? formatDate(beneficiaire.dateFinc) : 'N/A' }}</small>
              </div>
            </div>
          </div>
        </div>

      </div> <!-- Fermeture de la div.card-body -->
    </div> <!-- Fermeture de la div.card shadow-lg -->

  </div> <!-- Fermeture de la div.container -->
</main>

<!-- Footer -->
<footer class="bg-dark text-white py-4 mt-4">
  <div class="container">
    <div class="row">
      <div class="col-md-4">
        <h6>COUVERTURE SANITAIRE UNIVERSELLE</h6>
        <small>République du Sénégal</small>
      </div>
      <div class="col-md-4 text-center">
        <small>© {{ today.getFullYear() }} CSU Sénégal</small><br>
        <small class="text-muted">Version 1.0</small>
      </div>
      <div class="col-md-4 text-end">
        <small>
          <i class="fas fa-phone me-1"></i> 33 800 00 00<br>
          <i class="fas fa-envelope me-1"></i> contact@csu.sn
        </small>
      </div>
    </div>
  </div>
</footer>
  `,
  styles: [`
   /* =========================
   VARIABLES GLOBALES
   ========================= */
:root {
  --primary: #0d6efd;
  --primary-dark: #0b5ed7;
  --success: #198754;
  --danger: #dc3545;
  --warning: #ffc107;
  --light-bg: #f8f9fa;
  --text-dark: #212529;
  --border-soft: #e3e6ea;
  --shadow-soft: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* =========================
   GLOBAL
   ========================= */
body {
  background-color: #f4f6f9;
  color: var(--text-dark);
  font-family: "Segoe UI", Roboto, Arial, sans-serif;
}

h1, h2, h3, h4 {
  font-weight: 600;
}

/* =========================
   HEADER
   ========================= */
header {
  border-bottom: 3px solid var(--primary);
}

header h1 {
  letter-spacing: 0.5px;
}

header img {
  object-fit: contain;
}

/* =========================
   CARTES
   ========================= */
.card {
  border-radius: 12px;
  border: none;
}

.card.shadow,
.card.shadow-lg {
  box-shadow: var(--shadow-soft);
}

.card-header {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  padding: 1rem 1.5rem;
}

.card-header h3 {
  font-weight: 600;
}

/* =========================
   ETATS CARTE
   ========================= */
.bg-success,
.bg-danger {
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15),
    rgba(0, 0, 0, 0.1)
  );
}

/* =========================
   IDENTITÉ BÉNÉFICIAIRE
   ========================= */
.rounded-circle {
  border: 4px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.badge {
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* Matricule */
.badge.bg-primary {
  background-color: var(--primary);
  padding: 0.6rem 1rem;
}

/* =========================
   SECTIONS
   ========================= */
h4 {
  margin-bottom: 1rem;
}

h4 i {
  opacity: 0.85;
}

.border-bottom {
  border-color: var(--border-soft) !important;
}

/* Bloc informations */
.card-body.bg-light {
  background-color: var(--light-bg) !important;
  border-radius: 10px;
  border: 1px solid var(--border-soft);
}

/* Labels */
label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* =========================
   LISTES & TEXTES
   ========================= */
p {
  margin-bottom: 0.5rem;
}

small.text-muted {
  font-size: 0.8rem;
}

/* =========================
   PROGRESS BAR
   ========================= */
.progress {
  background-color: #e9ecef;
  border-radius: 30px;
  overflow: hidden;
}

.progress-bar {
  font-weight: 600;
  transition: width 1.5s ease-in-out;
}

/* =========================
   BOUTONS
   ========================= */
.btn {
  border-radius: 8px;
  font-weight: 500;
}

.btn-light {
  background-color: #ffffff;
  border: 1px solid var(--border-soft);
}

.btn-light:hover {
  background-color: var(--light-bg);
}

/* =========================
   LOADING
   ========================= */
.spinner-border {
  border-width: 0.3em;
}

/* =========================
   FOOTER
   ========================= */
footer {
  font-size: 0.85rem;
}

footer h6 {
  font-weight: 600;
}

footer small {
  opacity: 0.85;
}

/* =========================
   RESPONSIVE
   ========================= */
@media (max-width: 768px) {
  header h1 {
    font-size: 1rem;
  }

  .card-body {
    padding: 1.2rem !important;
  }

  .text-end {
    text-align: center !important;
    margin-top: 0.5rem;
  }
}

  `]
})
export class AppComponent implements OnInit {
  loading = true;
  error = false;
  errorMessage = '';
  currentUrl = '';
  beneficiaire: Beneficiaire | null = null;
  today = new Date();
  
  @ViewChild('qrCanvas', { static: false }) qrCanvas!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.currentUrl = window.location.href;
    console.log('🌐 URL actuelle:', this.currentUrl);
    
    const debugInfo = {
      url: this.currentUrl,
      port: window.location.port,
      search: window.location.search,
      hostname: window.location.hostname,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Debug info:', debugInfo);
    
    const code = this.extractCodeAllMethods();
    
    console.log('🔑 Code final:', code);
    
    if (code) {
      this.loadBeneficiaire(code);
    } else {
      this.error = true;
      this.errorMessage = 'Aucun code bénéficiaire trouvé dans l\'URL';
      this.loading = false;
    }
  }

  private handleError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else {
      return String(error);
    }
  }
formatDated(date?: string): string {
  if (!date) {
    return 'N/A';
  }
  return new Date(date).toLocaleDateString('fr-FR');
}

 extractCodeAllMethods(): string | null {
  console.log('🔍 URL complète:', window.location.href);
  console.log('🔍 Search:', window.location.search);
  
  // Essayer différentes méthodes
  let code: string | null = null;
  
  // Méthode 1: Depuis l'URL (ex: ?code=ABC123)
  const urlParams = new URLSearchParams(window.location.search);
  code = urlParams.get('code');
  
  // Méthode 2: Depuis les fragments (ex: #code=ABC123)
  if (!code && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    code = hashParams.get('code');
  }
  
  // Méthode 3: Parsing manuel de l'URL
  if (!code) {
    const url = window.location.href;
    const regex = /[?&]code=([^&]*)/;
    const match = url.match(regex);
    if (match) {
      code = decodeURIComponent(match[1]);
    }
  }
  
  console.log('🔍 Code extrait:', code);
  
  // VÉRIFICATION CRITIQUE : le code ne doit pas être "codeImmatriculation"
  if (code === 'codeImmatriculation') {
    console.error('❌ ERREUR: Le code est "codeImmatriculation" au lieu de la vraie valeur');
    return null;
  }
  
  return code;
}
  // NOUVELLE MÉTHODE : Récupérer la catégorie du type bénéficiaire
  getCategorieTypeBeneficiaire(): string {
    if (!this.beneficiaire?.typeBeneficiaire) return 'CLASSIQUE';
    
    if (typeof this.beneficiaire.typeBeneficiaire === 'string') {
      return this.beneficiaire.typeBeneficiaire;
    }
    
    // Récupérer le libellé de la catégorie (categorieTB.libelle)
    return this.beneficiaire.typeBeneficiaire?.categorieTB?.libelle || 
           this.beneficiaire.typeBeneficiaire.libelle || 
           'CLASSIQUE';
  }
  // loadBeneficiaire(code: string): void {
  //   console.log('📞 Appel API avec code:', code);
    
  //   this.apiService.getBeneficiaire(code).subscribe({
  //     next: (data) => {
  //       console.log('✅ Données reçues:', data);
  //       this.beneficiaire = data;
  //       this.loading = false;
  //       setTimeout(() => this.generateQRCode(), 100);
  //     },
  //     error: (err) => {
  //       console.error('❌ Erreur API:', err);
  //       this.error = true;
  //       this.errorMessage = `Erreur API: ${err.message || err.statusText}`;
  //       this.loading = false;
  //     }
  //   });
  // }
// ✅ NOUVELLE MÉTHODE AVEC FALLBACK - GARDEZ CELLE-CI
loadBeneficiaire(code: string): void {
  console.log('📞 Appel API avec code:', code);
  
  // ESSAYEZ CETTE APPROCHE D'ABORD
  this.apiService.getBeneficiaire(code).subscribe({
    next: (data) => {
      console.log('✅ Données reçues (méthode 1):', data);
      this.beneficiaire = data;
      this.loading = false;
      setTimeout(() => this.generateQRCode(), 100);
    },
    error: (err) => {
      console.log('❌ Méthode 1 échouée, tentative méthode 2...');
      
      // Méthode de secours
      this.apiService.getBeneficiaireFallback(code).subscribe({
        next: (data) => {
          console.log('✅ Données reçues (méthode 2):', data);
          this.beneficiaire = data;
          this.loading = false;
          setTimeout(() => this.generateQRCode(), 100);
        },
        error: (fallbackErr) => {
          console.error('❌ Toutes les méthodes ont échoué:', fallbackErr);
          this.error = true;
          this.errorMessage = `
            Impossible de récupérer les données.
            
            Cause : Le serveur API envoie des headers CORS incorrects
            (Access-Control-Allow-Origin: *, * au lieu de Access-Control-Allow-Origin: *)
            
            Solutions :
            1. Contactez l'administrateur du serveur pour corriger les headers CORS
            2. Utilisez un proxy serveur
            3. Testez avec un proxy CORS public
            
            Erreur : ${fallbackErr.message}
          `;
          this.loading = false;
        }
      });
    }
  });
}
  generateQRCode(): void {
    if (!this.beneficiaire || !this.qrCanvas?.nativeElement) return;
    
    const qrData = JSON.stringify({
      code: this.beneficiaire.codeImmatriculation,
      nom: this.beneficiaire.nom,
      prenom: this.beneficiaire.prenom,
      dateNaissance: this.beneficiaire.dateNaissance,
      validite: this.isCardValid() ? 'VALIDE' : 'EXPIREE',
      dateVerification: new Date().toISOString()
    });
    
    QRCode.toCanvas(this.qrCanvas.nativeElement, qrData, {
      width: 120,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }, (error) => {
      if (error) console.error('❌ Erreur QR Code:', error);
    });
  }

  // Méthodes utilitaires pour gérer le typeBeneficiaire qui peut être string ou TypeBeneficiaire
  getTypeBeneficiaireLibelle(): string {
    if (!this.beneficiaire?.typeBeneficiaire) return 'CLASSIQUE';
    
    if (typeof this.beneficiaire.typeBeneficiaire === 'string') {
      return this.beneficiaire.typeBeneficiaire;
    }
    
    return this.beneficiaire.typeBeneficiaire.libelle || 'CLASSIQUE';
  }

  getPaquetSoinLibelle(): string {
    if (!this.beneficiaire?.typeBeneficiaire) return 'CLASSIQUE';
    
    if (typeof this.beneficiaire.typeBeneficiaire === 'string') {
      return 'CLASSIQUE';
    }
    
    return this.beneficiaire.typeBeneficiaire.paquetSoin?.libelle || 'CLASSIQUE';
  }

  getTauxCouverture(): string {
    if (!this.beneficiaire?.typeBeneficiaire) return '80';
    
    if (typeof this.beneficiaire.typeBeneficiaire === 'string') {
      return '80';
    }
    
    return this.beneficiaire.typeBeneficiaire.paquetSoin?.taux?.toString() || '80';
  }

  getPhotoUrl(): string {
    if (!this.beneficiaire?.photo) return '';
    return `data:${this.beneficiaire.photoContentType || 'image/png'};base64,${this.beneficiaire.photo}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getAge(): number {
    if (!this.beneficiaire?.dateNaissance) return 0;
    const birthDate = new Date(this.beneficiaire.dateNaissance);
    const ageDiffMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  isCardValid(): boolean {
    if (!this.beneficiaire?.dateFinc) return false;
    const endDate = new Date(this.beneficiaire.dateFinc);
    return endDate >= new Date();
  }

  getDaysRemaining(): number {
    if (!this.beneficiaire?.dateFinc) return 0;
    const endDate = new Date(this.beneficiaire.dateFinc);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
    getRelationLibelle(): string {
    if (!this.beneficiaire?.relation) return 'Lui-même';
    if (typeof this.beneficiaire.relation === 'string') {
      return this.beneficiaire.relation;
    }
    return this.beneficiaire.relation.libelle || 'Lui-même';
  }
 getTitulaireNomComplet(): string {
    if (!this.beneficiaire?.titulaire) return 'Lui-même';
    return `${this.beneficiaire.titulaire.prenom || ''} ${this.beneficiaire.titulaire.nom || ''}`.trim() || 'Lui-même';
  }

  getCategorieLibelle(): string {
    if (!this.beneficiaire?.typeBeneficiaire) return 'CLASSIQUE';
    
    if (typeof this.beneficiaire.typeBeneficiaire === 'string') {
      return 'CLASSIQUE';
    }
    
    return this.beneficiaire.typeBeneficiaire.categorieTB?.libelle || 'CLASSIQUE';
  }

  getStructureInfo(): string {
    return `Structure ID: ${this.beneficiaire?.structureId || 'N/A'}`;
  }

  formatDateTime(dateTimeString: string): string {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMontantCotisation(): string {
    if (!this.beneficiaire?.typeBeneficiaire) return '0';
    
    if (typeof this.beneficiaire.typeBeneficiaire === 'string') {
      return '3 500';
    }
    
    const montant = this.beneficiaire.typeBeneficiaire.montantCotisation;
    if (montant) {
      return montant.toLocaleString('fr-FR');
    }
    
    return '3 500';
  }

  getProgress(): number {
    if (!this.beneficiaire?.dateDebutc || !this.beneficiaire?.dateFinc) return 0;
    
    const startDate = new Date(this.beneficiaire.dateDebutc);
    const endDate = new Date(this.beneficiaire.dateFinc);
    const today = new Date();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = today.getTime() - startDate.getTime();
    
    if (totalDuration <= 0) return 100;
    
    let progress = (elapsedDuration / totalDuration) * 100;
    progress = Math.max(0, Math.min(100, progress));
    
    return progress;
  }

  getRegionName(regionId?: number): string {
    if (!regionId) return '';
    
    const regions: {[key: number]: string} = {
      1: 'Dakar',
      2: 'Thiès',
      3: 'Diourbel',
      4: 'Saint-Louis',
      5: 'Kaolack',
      6: 'Kolda',
      7: 'Ziguinchor',
      8: 'Tambacounda',
      9: 'Matam',
      10: 'Fatick',
      11: 'Louga',
      12: 'Kaffrine',
      13: 'Kédougou',
      14: 'Sédhiou'
    };
    return regions[regionId] || `Région ${regionId}`;
  }

  getDepartementName(departementId?: number): string {
    if (!departementId) return '';
    return `Département ${departementId}`;
  }

  printPage(): void {
    window.print();
  }

  sharePage(): void {
    if (navigator.share) {
      navigator.share({
        title: `Carte CSU - ${this.beneficiaire?.prenom} ${this.beneficiaire?.nom}`,
        text: `Vérification de la carte CSU de ${this.beneficiaire?.prenom} ${this.beneficiaire?.nom}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Lien copié dans le presse-papier !');
      });
    }
  }

  reloadPage(): void {
    window.location.reload();
  }
}