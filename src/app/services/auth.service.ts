import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token: string | null = null;
  
  constructor() {
    // Pour la démo, utilisez un token fixe
    // En production, ce token devrait venir de variables d'environnement
    this.token = environment.apiToken || this.getTokenFromStorage();
  }
  
  getToken(): string | null {
    return this.token;
  }
  
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('api_token', token);
  }
  
  private getTokenFromStorage(): string | null {
    return localStorage.getItem('api_token') || null;
  }
}