import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


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
    private apiUrl: string;

  constructor(private http: HttpClient) {
    // Détermine dynamiquement l'URL de l'API
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.apiUrl = 'https://mdamsigicmu.sec.gouv.sn/services/udam/api';
    } else {
      this.apiUrl = 'http://localhost:3031/api';
    }
  }


//   getBeneficiaire(code: string): Observable<Beneficiaire> {
//     // Ajoutez encodeURIComponent pour gérer les caractères spéciaux
//     const encodedCode = encodeURIComponent(code);
//     return this.http.get<Beneficiaire>(
//       `${environment.apiUrl}/beneficiairess/codeImmatriculation?code=${encodedCode}`
//     );
//   }
  getBeneficiaire(code: string): Observable<Beneficiaire> {
    const encodedCode = encodeURIComponent(code);
    return this.http.get<Beneficiaire>(
      `${this.apiUrl}/beneficiairess/codeImmatriculation?code=${encodedCode}`
    );
  }
}