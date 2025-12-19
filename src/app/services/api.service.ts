import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders , HttpBackend} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { catchError, timeout } from 'rxjs/operators';
import { ApiRawService } from './api-raw.service';


export interface PaquetSoin {
  id: number;
  libelle: string;
  taux: number;
  code: string;
  etat: boolean;
}

export interface CategorieTB {
  id: number;
  code: string;
  libelle: string;
}

export interface TypeBeneficiaire {
  id: number;
  code: string;
  libelle: string;
  paquetSoin?: PaquetSoin;
  categorieTB?: CategorieTB; // AJOUTÉ
  montantCotisation?: number;
  montantDroitAdhesion?: number;
}

export interface Adhesion {
  id?: number;
  adhesionType: string;
  dateAdhesion?: string; // AJOUTÉ
  nom?: string;
  prenom?: string;
  telephone?: string;
  typeBeneficiaire?: TypeBeneficiaire;
  dateDebutc?: string;
  dateFinc?: string;
  estPaye?: boolean;
  denomination?: string;
}

export interface Beneficiaire {
  id?: number;
  codeImmatriculation: string;
  code?: string;
  nom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  dateNaissance: string;
  lieuNaissance?: string;
  adresse?: string;
  region?: string;
  departement?: string;
  regionId?: number;
  departementId?: number;
  commune?: string;
  numeroPiece?: string;
  etat: string;
  dateDebutc?: string;
  dateFinc?: string;
  assureur?: string;
  typeAdhesion?: string;
  typeBeneficiaire?: TypeBeneficiaire | string;
  typeCotisation?: string;
  groupe?: string;
  dateInsert?: string;
  photo?: string;
  photoContentType?: string;
  statut?: string;
  adhesion?: Adhesion;
  // Champs supplémentaires de votre JSON
  adherent?: boolean;
  structureId?: number;
  userInsertId?: number;
  userUpdateId?: number;
  dateUpdate?: string;
  typePiece?: string;
  titulaire?: any;
  quitter?: any;
  titulaire_adherent?: any;
  numeroCsu?: string;
  enceinte?: any;
  aligner?: any;
  createwhithadhesion?: boolean;
  email?: string;
  autreRelation?: string;
  activitePrincipal?: string;
  numRNU?: string;
  reference?: string;
  idOffLine?: string;
  relation?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
     private httpWithoutInterceptors: HttpClient;
  
  // Utilisez l'un des proxys CORS publics
  private readonly proxyUrls = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://proxy.cors.sh/'
  ];
  
  private readonly token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJOTEVfVVNFUiIsImV4cCI6MTc2NjIyNzIxMH0.tVuo-RaQIzb0Dsly9FHfe9yDaeNYMj8fYQPhuOsvNO3l_N67_QYYLDpdvFPvkppvFOym8-J_GxEL2fzaH2eSvA';

  constructor(
    private http: HttpClient,
    private handler: HttpBackend,
    private apiRawService: ApiRawService
  ) {
    this.httpWithoutInterceptors = new HttpClient(handler);
  }

  /**
   * ESSAYEZ CETTE MÉTHODE EN PREMIER - Elle contourne les interceptors
   */
  getBeneficiaire(code: string): Observable<Beneficiaire> {
    const encodedCode = encodeURIComponent(code);
    
    // OPTION 1: Utiliser HttpClient sans interceptors
    const directUrl = `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${encodedCode}`;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json'
      // NE PAS mettre Content-Type pour les requêtes GET
    });

    return this.httpWithoutInterceptors.get<Beneficiaire>(directUrl, { 
      headers,
      withCredentials: false
    }).pipe(
      timeout(30000),
      catchError(error => {
        console.log('Méthode directe échouée, tentative avec proxy...', error);
        return this.getViaProxy(code);
      })
    );
  }

  /**
   * Utiliser un proxy CORS public
   */
  private getViaProxy(code: string): Observable<Beneficiaire> {
    const encodedCode = encodeURIComponent(code);
    const targetUrl = `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${encodedCode}`;
    
    // Essayer différents proxys
    const proxyUrl = this.proxyUrls[0] + encodeURIComponent(targetUrl);
    
    console.log('Using proxy URL:', proxyUrl);
    
    return this.httpWithoutInterceptors.get<any>(proxyUrl).pipe(
      timeout(30000),
      catchError(error => {
        console.log('Proxy 1 échoué, essai suivant...', error);
        return this.tryNextProxy(code, 1);
      })
    );
  }

  /**
   * Essayer le prochain proxy dans la liste
   */
  private tryNextProxy(code: string, index: number): Observable<Beneficiaire> {
    if (index >= this.proxyUrls.length) {
      return throwError(() => new Error('Tous les proxys ont échoué'));
    }
    
    const encodedCode = encodeURIComponent(code);
    const targetUrl = `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${encodedCode}`;
    const proxyUrl = this.proxyUrls[index] + encodeURIComponent(targetUrl);
    
    console.log(`Trying proxy ${index + 1}:`, proxyUrl);
    
    return this.httpWithoutInterceptors.get<any>(proxyUrl).pipe(
      timeout(30000),
      catchError(error => {
        console.log(`Proxy ${index + 1} échoué`, error);
        return this.tryNextProxy(code, index + 1);
      })
    );
  }

  /**
   * Méthode de secours avec XMLHttpRequest
   */
  getBeneficiaireFallback(code: string): Observable<Beneficiaire> {
    return this.apiRawService.getBeneficiaireRaw(code);
  }
}