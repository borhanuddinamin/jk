import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class HttpHelper {

    private http = inject(HttpClient);

    constructor() { }

    getDefaultHeaders() {
        return new HttpHeaders({
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*"
        });
    }

    getDefaultAuthHeaders() {
        // Try different possible token storage keys
        const token = localStorage.getItem('accessToken');
        
        // Check if token might be stored in a JSON object
        if (!token) {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    // Check common token property names
                    const jsonToken = user.token || user.accessToken || user.auth_token;
                    
                    if (jsonToken) {
                        return new HttpHeaders({
                            "Authorization": `Bearer ${jsonToken}`,
                            "Content-Type": "application/json",
                            "Accept": "application/json, text/plain, */*"
                        });
                    }
                } catch (e) {
                    console.warn('Failed to parse user JSON from localStorage', e);
                }
            }
            console.warn('Auth token not found in localStorage');
        }

        return new HttpHeaders({
            "Authorization": `Bearer ${token || ''}`,
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*"
        });
    }

    getWithFileHeaders() {
        // Try different possible token storage keys
        const token = localStorage.getItem('accessToken');
        
        // Check if token might be stored in a JSON object
        if (!token) {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    // Check common token property names
                    const jsonToken = user.token || user.accessToken || user.auth_token;
                    
                    if (jsonToken) {
                        return new HttpHeaders({
                            "Authorization": `Bearer ${jsonToken}`,
                            "Accept": "application/json, text/plain, */*"
                        });
                    }
                } catch (e) {
                    console.warn('Failed to parse user JSON from localStorage', e);
                }
            }
            console.warn('Auth token not found in localStorage');
        }

        // For file uploads, don't set Content-Type as the browser will set it with the boundary
        return new HttpHeaders({
            "Authorization": `Bearer ${token || ''}`,
            "Accept": "application/json, text/plain, */*"
        });
    }

    jsonBodyToUrl(jsonBody: any) {
        if (!jsonBody) {
            return '';
        }

        let params = new HttpParams();
        
        for (const key in jsonBody) {
            if (jsonBody.hasOwnProperty(key)) {
                const value = jsonBody[key];
                
                if (value === null || value === undefined) {
                    params = params.append(key, '');
                } else if (typeof value === 'object') {
                    params = params.append(key, JSON.stringify(value));
                } else {
                    params = params.append(key, value.toString());
                }
            }
        }
        
        const paramString = params.toString();
        return paramString ? `?${paramString}` : '';
    }

    getBody(jsonBody: any) {
        return jsonBody;
    }

    getCacheHeaders(headers: HttpHeaders) {
        if (!headers) {
            return new HttpHeaders({
                'Content-Type': 'application/json',
                'x-request-cache': 'Y'
            });
        }
        
        // HttpHeaders are immutable, so we need to create a new instance
        return headers.set('x-request-cache', 'Y');
    }

    // Add user info to request body if needed
    private addUserInfoToBody(body: any, isAddUserInfo: boolean): any {
        if (!isAddUserInfo) return body;
        
        try {
            // Get user from localStorage directly like in AuthService
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                
                // Handle FormData differently than JSON objects
                if (body instanceof FormData) {
                    const processedBody = body;
                    processedBody.append('userId', user.user?.id || user.userId || '');
                    processedBody.append('userName', user.user?.userName || user.userName || '');
                    return processedBody;
                } else {
                    return { 
                        ...body, 
                        userId: user.user?.id || user.userId, 
                        userName: user.user?.userName || user.userName 
                    };
                }
            }
        } catch (error) {
            console.error('Error adding user info to request:', error);
        }
        
        return body;
    }

    // HTTP Methods
    httpPost<T>(url: string, body: any | null, isAddUserInfo: boolean = false, options?: {
        headers?: HttpHeaders | {
            [header: string]: string | string[];
        };
        observe?: 'body';
        params?: HttpParams | {
            [param: string]: string | string[];
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
        cachable?: boolean;
    }): Observable<T> {
        //const processedBody = this.addUserInfoToBody(body, isAddUserInfo);
        
        // Set withCredentials to true to include cookies in cross-site requests
        const updatedOptions = { ...options, withCredentials: true };
        
        return this.http.post<T>(url, body);
    }

    httpGet<T>(url: string, options?: {
        headers?: HttpHeaders | {
            [header: string]: string | string[];
        };
        observe?: 'body';
        params?: HttpParams | {
            [param: string]: string | string[];
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
        cachable?: boolean;
    }): Observable<T> {
        // Set withCredentials to true to include cookies in cross-site requests
        const updatedOptions = { ...options, withCredentials: true };
        
        return this.http.get<T>(url, updatedOptions);
    }

    // Added new methods for other HTTP verbs
    httpPut<T>(url: string, body: any | null, isAddUserInfo: boolean = false, options?: {
        headers?: HttpHeaders | {
            [header: string]: string | string[];
        };
        observe?: 'body';
        params?: HttpParams | {
            [param: string]: string | string[];
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<T> {
        const processedBody = this.addUserInfoToBody(body, isAddUserInfo);
        const updatedOptions = { ...options, withCredentials: true };
        
        return this.http.put<T>(url, processedBody, updatedOptions);
    }

    httpDelete<T>(url: string, options?: {
        headers?: HttpHeaders | {
            [header: string]: string | string[];
        };
        observe?: 'body';
        params?: HttpParams | {
            [param: string]: string | string[];
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
        body?: any;
    }): Observable<T> {
        const updatedOptions = { ...options, withCredentials: true };
        
        return this.http.delete<T>(url, updatedOptions);
    }

    httpPatch<T>(url: string, body: any | null, isAddUserInfo: boolean = false, options?: {
        headers?: HttpHeaders | {
            [header: string]: string | string[];
        };
        observe?: 'body';
        params?: HttpParams | {
            [param: string]: string | string[];
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<T> {
        const processedBody = this.addUserInfoToBody(body, isAddUserInfo);
        const updatedOptions = { ...options, withCredentials: true };
        
        return this.http.patch<T>(url, processedBody, updatedOptions);
    }
}