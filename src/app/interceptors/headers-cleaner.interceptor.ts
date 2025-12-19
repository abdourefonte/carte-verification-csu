import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class HeadersCleanerInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Cloner la requête pour ajouter nos propres headers
    const cleanReq = req.clone({
      setHeaders: {
        // Ne pas envoyer Access-Control-Allow-Origin depuis le client
        // Le serveur doit le gérer
      }
    });

    return next.handle(cleanReq).pipe(
      map((event: HttpEvent<any>) => {
        // Si c'est une réponse, on peut essayer de la nettoyer
        if (event instanceof HttpResponse) {
          // Vérifier et nettoyer les headers en double
          const headers = this.cleanDuplicateHeaders(event.headers);
          
          return event.clone({
            headers: headers
          });
        }
        return event;
      })
    );
  }

  /**
   * Nettoie les headers en double (spécifiquement Access-Control-Allow-Origin)
   */
  private cleanDuplicateHeaders(headers: any): any {
    const headerMap = new Map<string, string>();
    
    // Parcourir tous les headers
    headers.keys().forEach((key: string) => {
      const values = headers.getAll(key);
      
      if (values && values.length > 0) {
        // Pour Access-Control-Allow-Origin, prendre seulement la première valeur
        if (key.toLowerCase() === 'access-control-allow-origin') {
          headerMap.set(key, values[0]);
        } else {
          // Pour les autres headers, garder toutes les valeurs
          headerMap.set(key, values.join(', '));
        }
      }
    });
    
    // Reconstruire les headers nettoyés
    const cleanedHeaders = new Map<string, string[]>();
    headerMap.forEach((value, key) => {
      cleanedHeaders.set(key, [value]);
    });
    
    return this.mapToHttpHeaders(cleanedHeaders);
  }

  /**
   * Convertit une Map en HttpHeaders
   */
  private mapToHttpHeaders(map: Map<string, string[]>): any {
    const headers: { [key: string]: string } = {};
    map.forEach((values, key) => {
      headers[key] = values[0];
    });
    return headers;
  }
}