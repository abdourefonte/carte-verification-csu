import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';

  // Simulez la méthode getToken() de votre backend
  getToken(): string {
    // Retourne le token fixe (comme dans votre backend)
    return 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfVVNFUiIsImV4cCI6MTc2NjIyNzIxMH0.tVuo-RaQIzb0Dsly9FHfe9yDaeNYMj8fYQPhuOsvNO3l_N67_QYYLDpdvFPvkppvFOym8-J_GxEL2fzaH2eSvA';
  }

  // Ou si vous voulez le stocker dans localStorage
  getTokenFromStorage(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }
}