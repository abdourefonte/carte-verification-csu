import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ApiRawService } from '../../services/api-raw.service';

@Component({
  selector: 'app-cors-fix',
  template: `
    <div class="cors-fix card">
      <div class="card-header bg-warning">
        <h5 class="mb-0">🔧 Debug CORS - Headers en double</h5>
      </div>
      <div class="card-body">
        <p class="alert alert-info">
          <strong>Problème détecté :</strong><br>
          Le serveur envoie <code>Access-Control-Allow-Origin: *, *</code><br>
          (deux valeurs au lieu d'une seule)
        </p>
        
        <div class="mb-3">
          <label>Code à tester :</label>
          <input type="text" class="form-control" [(ngModel)]="testCode" 
                 value="995-9743-20">
        </div>
        
        <div class="btn-group-vertical w-100">
          <button class="btn btn-primary mb-2" (click)="testMethod1()" 
                  [disabled]="testing">
            🎯 Méthode 1: HttpClient sans interceptors
          </button>
          
          <button class="btn btn-secondary mb-2" (click)="testMethod2()" 
                  [disabled]="testing">
            🔄 Méthode 2: XMLHttpRequest direct
          </button>
          
          <button class="btn btn-info mb-2" (click)="testMethod3()" 
                  [disabled]="testing">
            🌐 Méthode 3: Proxy CORS
          </button>
          
          <button class="btn btn-success mb-2" (click)="testAllMethods()" 
                  [disabled]="testing">
            🚀 Tester toutes les méthodes
          </button>
        </div>
        
        <div *ngIf="results.length > 0" class="mt-4">
          <h6>Résultats :</h6>
          <div *ngFor="let result of results" class="mb-3">
            <div class="card" [ngClass]="result.success ? 'border-success' : 'border-danger'">
              <div class="card-body">
                <h6>{{ result.method }}</h6>
                <p [ngClass]="result.success ? 'text-success' : 'text-danger'">
                  {{ result.success ? '✅ SUCCÈS' : '❌ ÉCHEC' }}
                </p>
                <p *ngIf="result.data">
                  <strong>Données :</strong> {{ result.data.nom }} {{ result.data.prenom }}
                </p>
                <p *ngIf="result.error" class="text-danger">
                  <strong>Erreur :</strong> {{ result.error }}
                </p>
                <small class="text-muted">Temps : {{ result.time }}ms</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CorsFixComponent {
  testCode = '995-9743-20';
  testing = false;
  results: any[] = [];
  
  constructor(
    private apiService: ApiService,
    private apiRawService: ApiRawService
  ) {}
  
  async testMethod1() {
    this.testing = true;
    const startTime = Date.now();
    
    try {
      const data = await this.apiService.getBeneficiaire(this.testCode).toPromise();
      this.results.push({
        method: 'HttpClient sans interceptors',
        success: true,
        data: data,
        time: Date.now() - startTime
      });
    } catch (error: any) {
      this.results.push({
        method: 'HttpClient sans interceptors',
        success: false,
        error: error.message,
        time: Date.now() - startTime
      });
    }
    
    this.testing = false;
  }
  
  async testMethod2() {
    this.testing = true;
    const startTime = Date.now();
    
    try {
      const data = await this.apiRawService.getBeneficiaireFetch(this.testCode);
      this.results.push({
        method: 'XMLHttpRequest/Fetch direct',
        success: true,
        data: data,
        time: Date.now() - startTime
      });
    } catch (error: any) {
      this.results.push({
        method: 'XMLHttpRequest/Fetch direct',
        success: false,
        error: error.message,
        time: Date.now() - startTime
      });
    }
    
    this.testing = false;
  }
  
  async testMethod3() {
    this.testing = true;
    const startTime = Date.now();
    
    try {
      const data = await this.apiRawService.getBeneficiaireFetch(this.testCode);
      this.results.push({
        method: 'Via Proxy CORS',
        success: true,
        data: data,
        time: Date.now() - startTime
      });
    } catch (error: any) {
      this.results.push({
        method: 'Via Proxy CORS',
        success: false,
        error: error.message,
        time: Date.now() - startTime
      });
    }
    
    this.testing = false;
  }
  
  async testAllMethods() {
    this.results = [];
    await this.testMethod1();
    await this.testMethod2();
    await this.testMethod3();
  }
}