import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders , HttpBackend} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

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
    private readonly proxyUrl = '/api/proxy';
  
  constructor(private http: HttpClient) {}

  /**
   * Récupère les informations d'un bénéficiaire via le proxy Vercel
   */
  getBeneficiaire(code: string): Observable<Beneficiaire> {
    const encodedCode = encodeURIComponent(code);
    
    // URL format: /api/proxy/beneficiairess/codeImmatriculation?code=...
    const url = `${this.proxyUrl}/beneficiairess/codeImmatriculation?code=${encodedCode}`;
    
    console.log('📡 Using proxy URL:', url);
    
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.get<Beneficiaire>(url, { headers });
  }
}