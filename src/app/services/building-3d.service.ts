// building-3d.service.ts - Enhanced with automatic 401 error handling
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { map, switchMap, catchError, tap, retry, retryWhen, delayWhen, take } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { environment } from '../../environments/enviroment';

export interface Building3DModel {
  buildingId: string;
  objData: string;
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  metadata?: {
    vertexCount: number;
    faceCount: number;
    size: number;
  };
}

export interface AddressSearchResult {
  buildingId: string;
  address: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  hasModel: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Building3DService {
  private baseUrl = environment.api.baseUrl;
  private parcelApiUrl = 'https://api.datenserviceplus.online/v1/parcels';
  
  // Cache for loaded models
  private modelCache = new Map<string, Building3DModel>();
  
  // Loading state management
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * ✅ Enhanced HTTP request with automatic token refresh on 401
   */
  private makeAuthenticatedRequest<T>(
    url: string, 
    options: { headers?: HttpHeaders; responseType?: any } = {}
  ): Observable<T> {
    return this.authService.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'X-API-Key': environment.api.apiKey,
          ...options.headers?.keys().reduce((acc, key) => {
            acc[key] = options.headers!.get(key) || '';
            return acc;
          }, {} as any)
        });

        const requestOptions = {
          ...options,
          headers
        };

        return this.http.get<T>(url, requestOptions);
      }),
      retryWhen(errors =>
        errors.pipe(
          switchMap((error: HttpErrorResponse, index) => {
            // Handle 401 Unauthorized errors
            if (error.status === 401 && index < 2) {
              console.log(`401 error detected, attempt ${index + 1}/2 - refreshing token`);
              return this.authService.handleUnauthorizedError().pipe(
                delayWhen(() => new Promise(resolve => setTimeout(resolve, 1000))) // Small delay
              );
            }
            
            // Handle network errors (but limit retries)
            if (error.status === 0 && index < 1) {
              console.log('Network error detected, retrying...');
              return new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Don't retry other errors
            return throwError(() => error);
          }),
          take(3) // Maximum 3 total attempts
        )
      ),
      catchError((error: HttpErrorResponse) => {
        console.error('Request failed after retries:', error);
        
        let errorMessage = 'Unbekannter Fehler';
        if (error.status === 0) {
          errorMessage = 'Netzwerkfehler - Bitte prüfen Sie Ihre Internetverbindung';
        } else if (error.status === 401) {
          errorMessage = 'Authentifizierungsfehler - Bitte versuchen Sie es später erneut';
        } else if (error.status === 403) {
          errorMessage = 'Zugriff verweigert - Unzureichende Berechtigung';
        } else if (error.status === 404) {
          errorMessage = 'Keine Daten gefunden';
        } else if (error.status === 429) {
          errorMessage = 'Zu viele Anfragen - Bitte warten Sie einen Moment';
        } else if (error.status >= 500) {
          errorMessage = 'Serverfehler - Bitte versuchen Sie es später erneut';
        }
        
        this.errorSubject.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * ✅ Search for buildings by address with enhanced error handling
   */
  searchBuildingsByAddress(address: string): Observable<AddressSearchResult[]> {
    // Only make API calls in browser
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    if (!address || address.trim().length === 0) {
      return of([]);
    }

    console.log('Searching for buildings with address:', address);
    this.errorSubject.next(null);

    const url = `${this.baseUrl}/buildings?address=${encodeURIComponent(address.trim())}`;
    
    return this.makeAuthenticatedRequest<any>(url).pipe(
      map(response => {
        console.log('Buildings search response:', response);
        
        if (!response || !response.features || !Array.isArray(response.features)) {
          console.log('No features found in response');
          return [];
        }

        if (response.features.length === 0) {
          console.log('Empty features array');
          return [];
        }

        const results = response.features.map((feature: any, index: number): AddressSearchResult | null => {
          try {
            const props = feature.properties || {};
            const coords = feature.geometry?.coordinates || [0, 0];
            
            const result: AddressSearchResult = {
              buildingId: props.buildingId || `unknown_${index}`,
              address: this.constructAddress(props),
              coordinates: {
                lat: coords[1] || 0,
                lon: coords[0] || 0
              },
              hasModel: !!props.buildingId
            };
            
            console.log('Processed building result:', result);
            return result;
          } catch (err) {
            console.warn('Error processing feature:', feature, err);
            return null;
          }
        }).filter((result: AddressSearchResult | null): result is AddressSearchResult => result !== null);

        console.log(`Found ${results.length} valid building results`);
        return results;
      }),
      catchError(error => {
        console.error('Error in searchBuildingsByAddress:', error);
        return of([]);
      })
    );
  }

  /**
   * ✅ Get 3D model for a specific building ID with enhanced error handling
   */
  getBuilding3DModel(buildingId: string): Observable<Building3DModel | null> {
    // Only make API calls in browser
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    if (!buildingId || buildingId.trim().length === 0) {
      return of(null);
    }

    // Check cache first
    if (this.modelCache.has(buildingId)) {
      console.log('Returning cached model for buildingId:', buildingId);
      return of(this.modelCache.get(buildingId)!);
    }

    console.log('Loading 3D model for buildingId:', buildingId);
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const url = `${this.baseUrl}/building-models?buildingIds=${encodeURIComponent(buildingId)}`;

    return this.makeAuthenticatedRequest<string>(url, { responseType: 'text' }).pipe(
      map(objData => {
        if (!objData || objData.trim().length === 0) {
          throw new Error('Empty model data received');
        }

        // Basic validation of OBJ data
        if (!objData.includes('v ') && !objData.includes('f ')) {
          throw new Error('Invalid OBJ format - no vertices or faces found');
        }

        const model: Building3DModel = {
          buildingId,
          objData,
          metadata: this.extractModelMetadata(objData)
        };

        console.log('Successfully loaded model:', {
          buildingId,
          metadata: model.metadata
        });

        // Cache the model
        this.modelCache.set(buildingId, model);
        
        return model;
      }),
      tap({
        next: () => this.loadingSubject.next(false),
        error: () => this.loadingSubject.next(false)
      }),
      catchError(error => {
        console.error('Error loading 3D model:', error);
        this.loadingSubject.next(false);
        return of(null);
      })
    );
  }

  /**
   * ✅ Get the first available building ID for an address
   */
  getBuildingIdByAddress(address: string): Observable<string | null> {
    return this.searchBuildingsByAddress(address).pipe(
      map(results => {
        const buildingWithModel = results.find(r => r.hasModel && r.buildingId);
        console.log('Found building ID for address:', address, '→', buildingWithModel?.buildingId || 'none');
        return buildingWithModel?.buildingId || null;
      })
    );
  }

  /**
   * ✅ Check if a 3D model is available for an address
   */
  hasModelForAddress(address: string): Observable<boolean> {
    return this.searchBuildingsByAddress(address).pipe(
      map(results => {
        const hasModel = results.some(r => r.hasModel);
        console.log('Has model for address:', address, '→', hasModel);
        return hasModel;
      })
    );
  }

  /**
   * ✅ Clear the model cache
   */
  clearCache(): void {
    console.log('Clearing model cache');
    this.modelCache.clear();
  }

  /**
   * ✅ Get cache size info
   */
  getCacheInfo(): { count: number; buildingIds: string[] } {
    return {
      count: this.modelCache.size,
      buildingIds: Array.from(this.modelCache.keys())
    };
  }

  /**
   * ✅ Extract metadata from OBJ data
   */
  private extractModelMetadata(objData: string): Building3DModel['metadata'] {
    const lines = objData.split('\n');
    let vertexCount = 0;
    let faceCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('v ')) {
        vertexCount++;
      } else if (trimmed.startsWith('f ')) {
        faceCount++;
      }
    }

    return {
      vertexCount,
      faceCount,
      size: objData.length
    };
  }

  /**
   * ✅ Construct address string from building properties
   */
  private constructAddress(props: any): string {
    const parts = [];
    
    if (props.street) parts.push(props.street);
    if (props.houseNumber) parts.push(props.houseNumber);
    if (props.postalCode) parts.push(props.postalCode);
    if (props.place) parts.push(props.place);
    
    return parts.join(' ') || 'Unbekannte Adresse';
  }

  /**
   * ✅ Reset loading and error states
   */
  resetState(): void {
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
  }

  /**
   * ✅ Get current authentication status
   */
  getAuthStatus(): { isAuthenticated: boolean; tokenInfo: any } {
    return {
      isAuthenticated: this.authService.isAuthenticated(),
      tokenInfo: this.authService.getTokenInfo()
    };
  }

  /**
   * ✅ Manually refresh authentication token
   */
  refreshAuth(): Observable<boolean> {
    return this.authService.refreshToken().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}