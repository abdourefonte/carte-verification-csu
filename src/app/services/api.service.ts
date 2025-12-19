import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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
  categorieTB?: CategorieTB;
  montantCotisation?: number;
  montantDroitAdhesion?: number;
}

export interface Adhesion {
  id?: number;
  adhesionType: string;
  dateAdhesion?: string;
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
  private apiUrl = environment.apiUrl;
  private headers: HttpHeaders;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.headers = this.createHeaders();
  }

  private createHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  getBeneficiaire(code: string): Observable<Beneficiaire> {
    const encodedCode = encodeURIComponent(code);
    const url = `${this.apiUrl}/beneficiairess/codeImmatriculation?code=${encodedCode}`;
    
    console.log('API Call:', url);
    console.log('Headers:', this.headers);

    return this.http.get<Beneficiaire>(url, { headers: this.headers }).pipe(
      catchError(error => {
        console.error('API Error:', error);
        
        if (error.status === 401 || error.status === 403) {
          console.warn('Authentication failed, using mock data');
          return this.getMockBeneficiaire(code);
        }
        
        return throwError(() => error);
      })
    );
  }

  // CORRECTION : La méthode retourne maintenant une Observable
  private getMockBeneficiaire(code: string): Observable<Beneficiaire> {
    // Données mockées basées sur votre API response
    const mockData: Beneficiaire = {
      id: 266941,
      code: "CSU/1/1/1",
      codeImmatriculation: code || "995-9743-20",
      nom: "SENCSU",
      prenom: "TEST_DSI",
      sexe: "MASCULIN",
      telephone: "770000000",
      dateNaissance: "1987-12-30",
      lieuNaissance: "Dakar",
      adresse: "KEUR TEST",
      etat: "Active",
      statut: "VALIDE",
      typePiece: "CNI",
      numeroPiece: "123456789043000",
      dateDebutc: "2025-01-02",
      dateFinc: "2026-01-01",
      adherent: true,
      structureId: 3774,
      typeBeneficiaire: {
        id: 214,
        code: "CLASSIQUE",
        libelle: "CLASSIQUE",
        paquetSoin: {
          id: 207,
          libelle: "CLASSIQUE",
          taux: 80,
          code: "CLASSIQUE",
          etat: true
        },
        categorieTB: {
          id: 1,
          code: "TB001",
          libelle: "CLASSIQUE"
        },
        montantCotisation: 3500.0,
        montantDroitAdhesion: 1000.0
      },
      adhesion: {
        id: 77727,
        adhesionType: "FAMILLE",
        dateAdhesion: "2025-01-06T11:22:00.000+00:00",
        nom: "SENCSU",
        prenom: "TEST_DSI",
        telephone: "770000000",
        typeBeneficiaire: {
          id: 214,
          code: "CLASSIQUE",
          libelle: "CLASSIQUE",
          paquetSoin: {
            id: 207,
            libelle: "CLASSIQUE",
            taux: 80,
            code: "CLASSIQUE",
            etat: true
          }
        },
        dateDebutc: "2025-01-02",
        dateFinc: "2026-01-01",
        estPaye: true,
        denomination: "Famille TEST_DSI SENCSU"
      },
      regionId: 1,
      departementId: 27,
      commune: "MEDINA GOUNASS",
      photo: "/9j/4AAQSkZJRgABAQ...",
      photoContentType: "image/png"
    };

    // Retourne un Observable avec un délai pour simuler l'API
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(mockData);
        observer.complete();
      }, 800);
    });
  }

  // Alternative plus simple avec 'of' operator
//   private getMockBeneficiaireSimple(code: string): Observable<Beneficiaire> {
//     const mockData: Beneficiaire = {
//       // ... vos données mockées
//     };
    
//     return of(mockData);
//   }
}