import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
     private readonly apiUrl = 'https://mdamsigicmu.sec.gouv.sn/services/udam/api';
  private header: HttpHeaders;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Initialisez les headers exactement comme dans votre backend
    this.header = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authService.getToken())
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    console.log('Headers initialisés:', this.header);
  }

  getBeneficiaire(code: string): Observable<Beneficiaire> {
    const encodedCode = encodeURIComponent(code);
    const url = `${this.apiUrl}/beneficiairess/codeImmatriculation?code=${encodedCode}`;
    
    console.log('URL:', url);
    console.log('Headers envoyés:', this.header);

    return this.http.get<Beneficiaire>(url, {
      headers: this.header,
      observe: 'body'  // Pas besoin de 'response' si vous voulez juste le corps
    });
  }

  // Version alternative avec création dynamique des headers
  getBeneficiaire2(code: string): Observable<Beneficiaire> {
    const encodedCode = encodeURIComponent(code);
    
    // Créez les headers dynamiquement comme dans votre backend
    const headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.authService.getToken())
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');

    return this.http.get<Beneficiaire>(
      `${this.apiUrl}/beneficiairess/codeImmatriculation?code=${encodedCode}`,
      { headers }
    );
  }
}