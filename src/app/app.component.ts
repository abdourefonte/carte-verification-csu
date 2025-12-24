import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Beneficiaire, TypeBeneficiaire } from './services/api.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-root',
  template: `
<!-- Header compact -->
<header class="bg-white shadow-sm py-2">
  <div class="container-fluid">
    <div class="row align-items-center">
      <div class="col-auto">
        <img src="assets/flag-senegal.webp" alt="Logo CSU" height="50">
      </div>
      <div class="col text-center">
        <h1 class="h5 mb-0 text-primary">COUVERTURE SANITAIRE UNIVERSELLE</h1>
        <p class="mb-0 text-muted"><small>République du Sénégal</small></p>
      </div>
      <div class="col-auto">
        <img src="assets/flag-senegal.webp" alt="Drapeau Sénégal" height="35">
      </div>
    </div>
  </div>
</header>

<!-- Main Content - Layout côte à côte -->
<main class="container-fluid py-3" style="height: calc(100vh - 120px);">
  
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

  <!-- Welcome Page -->
  <div *ngIf="!loading && !error && !beneficiaire" class="text-center py-5">
    <div class="card shadow">
      <div class="card-body p-5">
        <i class="fas fa-qr-code display-1 text-primary mb-4"></i>
        <h2 class="mb-3">Vérification Carte Bénéficiaire</h2>
        <p class="text-muted mb-4">
          Scannez un QR code de carte CSU pour vérifier sa validité
        </p>
      </div>
    </div>
  </div>

  <!-- Beneficiary Dashboard - Layout à deux colonnes -->
  <div *ngIf="!loading && !error && beneficiaire" class="h-100">
    
    <!-- Status Bar -->
    <div class="row mb-3">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-body py-2" [ngClass]="{'bg-success': isCardValid(), 'bg-danger': !isCardValid()}">
            <div class="row align-items-center">
              <div class="col-md-6 text-white">
                <h4 class="mb-0">
                  <i class="fas" [ngClass]="{'fa-check-circle': isCardValid(), 'fa-times-circle': !isCardValid()}"></i>
                  {{ isCardValid() ? 'CARTE VALIDE' : 'CARTE EXPIRÉE' }}
                </h4>
                <small>Vérifié le {{ today | date:'dd/MM/yyyy à HH:mm' }}</small>
              </div>
              <div class="col-md-6 text-end">
                <span class="badge bg-white text-dark me-2">
                  Code: {{ beneficiaire.code || 'N/A' }}
                </span>
                <button class="btn btn-light btn-sm me-2" (click)="printPage()">
                  <i class="fas fa-print"></i>
                </button>
                <button class="btn btn-light btn-sm" (click)="sharePage()">
                  <i class="fas fa-share-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="row g-3 h-100">
      <!-- Left Column (40%) -->
      <div class="col-md-4 d-flex flex-column h-100">
        
        <!-- Identity Card -->
        <div class="card shadow-sm h-100">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="fas fa-user me-2"></i>Identité</h5>
          </div>
          <div class="card-body">
            <!-- Photo & QR Code -->
            <div class="row mb-3">
              <div class="col-6 text-center">
                <div class="photo-container mb-2">
                  <div *ngIf="beneficiaire.photo" class="rounded-circle overflow-hidden mx-auto"
                       style="width: 100px; height: 100px;">
                    <img [src]="getPhotoUrl()" alt="Photo" class="img-fluid h-100 w-100">
                  </div>
                  <div *ngIf="!beneficiaire.photo" 
                       class="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto"
                       style="width: 100px; height: 100px;">
                    <i class="fas fa-user fs-2 text-muted"></i>
                  </div>
                </div>
                <div class="qr-code-container">
                  <canvas #qrCanvas style="width: 100px; height: 100px;"></canvas>
                </div>
              </div>
              <div class="col-6">
                <h4 class="text-primary">{{ beneficiaire.prenom }} {{ beneficiaire.nom }}</h4>
                <div class="mb-2">
                  <span class="badge bg-info">{{ getAge() }} ans</span>
                  <span class="badge ms-1" [ngClass]="{
                    'bg-success': beneficiaire.sexe === 'M',
                    'bg-purple': beneficiaire.sexe === 'F'
                  }">
                    {{ beneficiaire.sexe === 'M' ? 'Homme' : 'Femme' }}
                  </span>
                </div>
                <div class="small">
                  <div><strong>CNI:</strong> {{ beneficiaire.numeroPiece || 'N/A' }}</div>
                  <div><strong>Naissance:</strong> {{ formatDate(beneficiaire.dateNaissance) }}</div>
                  <div><strong>Lieu:</strong> {{ beneficiaire.lieuNaissance || 'N/A' }}</div>
                </div>
              </div>
            </div>

            <!-- Matricule -->
            <div class="text-center mb-3">
              <span class="badge bg-dark fs-6 p-2">
                {{ beneficiaire.codeImmatriculation }}
              </span>
            </div>

            <!-- Status & Contact -->
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="small text-muted">Statut</label>
                <div>
                  <span class="badge" [ngClass]="{
                    'bg-success': beneficiaire.etat === 'Active',
                    'bg-warning': beneficiaire.etat === 'SUSPENDRE',
                    'bg-danger': beneficiaire.etat === 'BLOQUER'
                  }">
                    {{ beneficiaire.etat }}
                  </span>
                </div>
              </div>
              <div class="col-6">
                <label class="small text-muted">Adhérent</label>
                <div>
                  <span class="badge" [ngClass]="beneficiaire.adherent ? 'bg-success' : 'bg-warning'">
                    {{ beneficiaire.adherent ? 'OUI' : 'NON' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Contact Info -->
            <div class="mb-3">
              <label class="small text-muted">Email</label>
              <p class="mb-1">{{ beneficiaire.email || 'Non renseigné' }}</p>
            </div>

            <!-- Type & Categorie -->
            <div class="row g-2">
              <div class="col-6">
                <label class="small text-muted">Type</label>
                <p class="mb-0 fw-bold">{{ getTypeBeneficiaireLibelle() }}</p>
              </div>
              <div class="col-6">
                <label class="small text-muted">Catégorie</label>
                <p class="mb-0 fw-bold">{{ getCategorieLibelle() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column (60%) -->
      <div class="col-md-8 d-flex flex-column h-100">
        
        <!-- Top Row - Adhesion & Coverage -->
        <div class="row g-3 mb-3 flex-grow-1">
          
          <!-- Adhesion Card -->
          <div class="col-md-6">
            <div class="card shadow-sm h-100">
              <div class="card-header bg-info text-white">
                <h5 class="mb-0"><i class="fas fa-users me-2"></i>Adhésion</h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="small text-muted">Titulaire</label>
                  <h6 class="mb-1">{{ getTitulaireNomComplet() }}</h6>
                  <small class="text-muted">{{ beneficiaire.titulaire?.telephone || '' }}</small>
                </div>

                <div class="mb-3">
                  <label class="small text-muted">Relation</label>
                  <p class="mb-1 fw-bold">{{ getRelationLibelle() }}</p>
                </div>

                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label class="small text-muted">Type Adhésion</label>
                    <p class="mb-1">{{ beneficiaire.adhesion?.adhesionType || 'Famille' }}</p>
                  </div>
                  <div class="col-6">
                    <label class="small text-muted">Famille</label>
                    <p class="mb-1">{{ beneficiaire.adhesion?.denomination || 'N/A' }}</p>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="small text-muted">Paiement</label>
                  <div class="d-flex align-items-center justify-content-between">
                    <span class="badge" [ngClass]="beneficiaire.adhesion?.estPaye ? 'bg-success' : 'bg-danger'">
                      {{ beneficiaire.adhesion?.estPaye ? 'PAYÉ' : 'NON PAYÉ' }}
                    </span>
                    <span class="text-primary fw-bold">
                      {{ getMontantCotisation() }} FCFA
                    </span>
                  </div>
                </div>

                <div class="small text-muted">
                  <div>Date enregistrement: {{ beneficiaire.dateInsert ? formatDateTime(beneficiaire.dateInsert) : 'N/A' }}</div>
                  <div>Date adhésion: {{ beneficiaire?.adhesion?.dateAdhesion ? formatDated(beneficiaire.adhesion?.dateAdhesion) : 'N/A' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Coverage Card -->
          <div class="col-md-6">
            <div class="card shadow-sm h-100">
              <div class="card-header bg-warning text-dark">
                <h5 class="mb-0"><i class="fas fa-calendar-check me-2"></i>Couverture</h5>
              </div>
              <div class="card-body">
                <!-- Dates -->
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label class="small text-muted">Début</label>
                    <p class="mb-1 fw-bold">{{ beneficiaire.dateDebutc ? formatDate(beneficiaire.dateDebutc) : 'N/A' }}</p>
                  </div>
                  <div class="col-6">
                    <label class="small text-muted">Fin</label>
                    <p class="mb-1 fw-bold">{{ beneficiaire.dateFinc ? formatDate(beneficiaire.dateFinc) : 'N/A' }}</p>
                  </div>
                </div>

                <!-- Progress & Days -->
                <div class="mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fs-4 fw-bold">{{ getDaysRemaining() }} jours</span>
                    <span class="text-muted small">restants</span>
                  </div>
                  <div class="progress" style="height: 20px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated"
                         [ngClass]="{'bg-success': isCardValid(), 'bg-danger': !isCardValid()}"
                         [style.width]="getProgress() + '%'">
                      {{ getProgress().toFixed(1) }}%
                    </div>
                  </div>
                </div>

                <!-- Paquet & Taux -->
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label class="small text-muted">Paquet soins</label>
                    <p class="mb-1 fw-bold">{{ getPaquetSoinLibelle() }}</p>
                  </div>
                  <div class="col-6">
                    <label class="small text-muted">Taux couverture</label>
                    <p class="mb-1 fw-bold">{{ getTauxCouverture() }}%</p>
                  </div>
                </div>

                <!-- Régime & Type -->
                <div class="row g-2">
                  <div class="col-6">
                    <label class="small text-muted">Régime</label>
                    <p class="mb-1">Contributif</p>
                  </div>
                  <div class="col-6">
                    <label class="small text-muted">Type bénéficiaire</label>
                    <p class="mb-1">{{ getCategorieTypeBeneficiaire() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Row - Address -->
        <div class="row flex-grow-1">
          <div class="col-12">
            <div class="card shadow-sm h-100">
              <div class="card-header bg-secondary text-white">
                <h5 class="mb-0"><i class="fas fa-home me-2"></i>Adresse</h5>
              </div>
              <div class="card-body">
                <div class="row h-100">
                  <div class="col-md-4 d-flex flex-column">
                    <label class="small text-muted">Adresse</label>
                    <div class="flex-grow-1">
                      <p class="fw-bold">{{ beneficiaire.adresse || 'N/A' }}</p>
                    </div>
                  </div>
                  <div class="col-md-4 d-flex flex-column">
                    <label class="small text-muted">Région</label>
                    <div class="flex-grow-1">
                      <p class="fw-bold">{{ beneficiaire.region || getRegionName(beneficiaire.regionId) || 'N/A' }}</p>
                    </div>
                  </div>
                  <div class="col-md-4 d-flex flex-column">
                    <label class="small text-muted">Département</label>
                    <div class="flex-grow-1">
                      <p class="fw-bold">{{ beneficiaire.departement || getDepartementName(beneficiaire.departementId) || 'N/A' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- Footer compact -->
<footer class="bg-dark text-white py-3">
  <div class="container-fluid">
    <div class="row align-items-center">
      <div class="col-md-4">
        <h6 class="mb-0">COUVERTURE SANITAIRE UNIVERSELLE</h6>
        <small>© {{ today.getFullYear() }} CSU Sénégal - Version 1.0</small>
      </div>
      <div class="col-md-4 text-center">
        <small class="text-muted">Système de vérification des cartes bénéficiaires</small>
      </div>
      <div class="col-md-4 text-end">
        <small>
          <i class="fas fa-phone me-1"></i> 33 800 00 00
          <i class="fas fa-envelope ms-3 me-1"></i> contact@csu.sn
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
  --info: #0dcaf0;
  --light-bg: #f8f9fa;
  --text-dark: #212529;
  --border-soft: #e3e6ea;
  --shadow-soft: 0 4px 12px rgba(0, 0, 0, 0.08);
  --purple: #6f42c1;
}

/* =========================
   GLOBAL
   ========================= */
body {
  background-color: #f4f6f9;
  color: var(--text-dark);
  font-family: "Segoe UI", Roboto, Arial, sans-serif;
  overflow: hidden;
  height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
}

/* =========================
   HEADER
   ========================= */
header {
  border-bottom: 3px solid var(--primary);
  height: 60px;
}

header h1 {
  letter-spacing: 0.5px;
  font-size: 1.1rem;
}

header img {
  object-fit: contain;
}

/* =========================
   MAIN LAYOUT
   ========================= */
main {
  min-height: auto;
  overflow-y: auto;
}

/* =========================
   CARDS
   ========================= */
.card {
  border-radius: 8px;
  border: none;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

.card.shadow-sm {
  box-shadow: var(--shadow-soft) !important;
}

.card-header {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 0.75rem 1rem;
}

.card-header h5 {
  font-weight: 600;
  font-size: 0.95rem;
}

.card-body {
  padding: 1rem;
}

/* =========================
   STATUS BADGES
   ========================= */
.badge {
  font-weight: 500;
  letter-spacing: 0.3px;
  border-radius: 20px;
  padding: 0.35em 0.65em;
}

.badge.bg-purple {
  background-color: var(--purple) !important;
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
  font-size: 0.75rem;
  line-height: 20px;
}

/* =========================
   QR CODE & PHOTO
   ========================= */
.photo-container img {
  object-fit: cover;
}

.qr-code-container canvas {
  border: 1px solid var(--border-soft);
  border-radius: 4px;
  padding: 4px;
  background: white;
}

/* =========================
   UTILITY CLASSES
   ========================= */
.text-small {
  font-size: 0.85rem;
}

.flex-grow-1 {
  flex-grow: 1;
}

/* =========================
   FOOTER
   ========================= */
footer {
  height: 60px;
  font-size: 0.8rem;
}

footer h6 {
  font-weight: 600;
}

/* =========================
   CUSTOM SCROLLBAR
   ========================= */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* =========================
   RESPONSIVE
   ========================= */
@media (max-width: 768px) {
  body {
    overflow-y: auto;
  }
  
  .h-100 {
    height: auto !important;
  }
  
  header h1 {
    font-size: 0.9rem;
  }
  
  .card-body {
    padding: 0.75rem !important;
  }
  
  .text-end {
    text-align: center !important;
    margin-top: 0.5rem;
  }
}

@media (max-width: 1200px) {
  :host {
    font-size: 14px;
  }
  
  .card-header h5 {
    font-size: 0.9rem;
  }
}
  `]
})
export class AppComponent implements OnInit {
  // Le reste du code TypeScript reste identique à votre version originale
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
    
    const code = this.extractCodeAllMethods();
    
    if (code) {
      this.loadBeneficiaire(code);
    } else {
      this.error = true;
      this.errorMessage = 'Aucun code bénéficiaire trouvé dans l\'URL';
      this.loading = false;
    }
  }

  // Les méthodes restent identiques à votre version originale
  formatDated(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  extractCodeAllMethods(): string | null {
    let code: string | null = null;
    const urlParams = new URLSearchParams(window.location.search);
    code = urlParams.get('code');
    
    if (!code && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      code = hashParams.get('code');
    }
    
    if (!code) {
      const url = window.location.href;
      const regex = /[?&]code=([^&]*)/;
      const match = url.match(regex);
      if (match) {
        code = decodeURIComponent(match[1]);
      }
    }
    
    if (code === 'codeImmatriculation') {
      return null;
    }
    
    return code;
  }

  getCategorieTypeBeneficiaire(): string {
    if (!this.beneficiaire?.typeBeneficiaire) return 'CLASSIQUE';
    
    if (typeof this.beneficiaire.typeBeneficiaire === 'string') {
      return this.beneficiaire.typeBeneficiaire;
    }
    
    return this.beneficiaire.typeBeneficiaire?.categorieTB?.libelle || 
           this.beneficiaire.typeBeneficiaire.libelle || 
           'CLASSIQUE';
  }

  loadBeneficiaire(code: string): void {
    this.apiService.getBeneficiaire(code).subscribe({
      next: (data) => {
        this.beneficiaire = data;
        this.loading = false;
        setTimeout(() => this.generateQRCode(), 100);
      },
      error: (err) => {
        this.error = true;
        this.errorMessage = `Erreur API: ${err.message || err.statusText}`;
        this.loading = false;
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
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }, (error) => {
      if (error) console.error('❌ Erreur QR Code:', error);
    });
  }

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
      1: 'Dakar', 2: 'Thiès', 3: 'Diourbel', 4: 'Saint-Louis',
      5: 'Kaolack', 6: 'Kolda', 7: 'Ziguinchor', 8: 'Tambacounda',
      9: 'Matam', 10: 'Fatick', 11: 'Louga', 12: 'Kaffrine',
      13: 'Kédougou', 14: 'Sédhiou'
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