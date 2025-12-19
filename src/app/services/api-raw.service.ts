import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiRawService {
  private readonly token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfVVNFUiIsImV4cCI6MTc2NjIyNzIxMH0.tVuo-RaQIzb0Dsly9FHfe9yDaeNYMj8fYQPhuOsvNO3l_N67_QYYLDpdvFPvkppvFOym8-J_GxEL2fzaH2eSvA';

  /**
   * Méthode qui utilise XMLHttpRequest directement pour plus de contrôle
   */
  getBeneficiaireRaw(code: string): Observable<any> {
    return new Observable(observer => {
      const xhr = new XMLHttpRequest();
      const encodedCode = encodeURIComponent(code);
      const url = `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${encodedCode}`;
      
      xhr.open('GET', url, true);
      
      // Définir les headers manuellement
      xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Désactiver certaines fonctionnalités qui pourraient causer des problèmes
      xhr.withCredentials = false;
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            observer.next(response);
            observer.complete();
          } catch (error) {
            observer.error(new Error('Erreur de parsing JSON'));
          }
        } else {
          observer.error(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        observer.error(new Error('Erreur réseau'));
      };
      
      xhr.ontimeout = () => {
        observer.error(new Error('Timeout'));
      };
      
      xhr.timeout = 30000; // 30 secondes
      
      xhr.send();
    });
  }
  
  /**
   * Alternative avec fetch et mode 'no-cors'
   */
  async getBeneficiaireFetch(code: string): Promise<any> {
    const encodedCode = encodeURIComponent(code);
    const url = `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${encodedCode}`;
    
    try {
      // Essayer d'abord avec une requête normale
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Fetch normale échouée, tentative avec proxy...');
      return await this.getViaProxy(code);
    }
  }
  
  /**
   * Utiliser un proxy pour contourner CORS
   */
  private async getViaProxy(code: string): Promise<any> {
    const encodedCode = encodeURIComponent(code);
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${encodedCode}`;
    
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`);
    }
    
    return await response.json();
  }
}