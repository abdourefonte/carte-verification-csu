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
  constructor(private http: HttpClient) {}

// api.service.ts - TEMPORAIRE
// getBeneficiaire(code: string): Observable<Beneficiaire> {
//   const encodedCode = encodeURIComponent(code);
  
//   // ⭐ UTILISEZ LE CHEMIN RELATIF VIA PROXY
//   return this.http.get<Beneficiaire>(
//     `/services/udam/api/beneficiairess/codeImmatriculation?code=${encodedCode}`,
//     {
//       headers: {
//         'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfVVNFUiIsImV4cCI6MTc2NjIzNDUwNX0.FVsVZmwRIL8u60bbTuQXzf9HcMG9DpLQqNbc4URjBjqXKvejncyehlrl2zZqEm8D0cgmPboi57431MfcDrNhtw'
//       }
//     }
//   );
// }
getBeneficiaire(code: string): Observable<Beneficiaire> {
  const encodedCode = encodeURIComponent(code);
  
  // Appelle VOTRE proxy sur Render
  return this.http.get<Beneficiaire>(
    `/api/api/beneficiairess/codeImmatriculation?code=${encodedCode}`
  );
}
}