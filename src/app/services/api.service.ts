import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Account endpoints
  public static readonly ACCOUNT = {
    LOGIN: '/Account/login'
  };

  // Associate endpoints
  public static readonly ASSOCIATE = {
    CREATE: '/Associate/Create',
    GET_ALL: '/Associate/GetAll',
    GET_BY_ID: (id: number) => `/Associate/Get/${id}`,
    UPDATE: (id: number) => `/Associate/Update/${id}`,
    DELETE: (id: number) => `/Associate/Delete/${id}`
  };

  // Other API endpoints can be organized by domain
  public static readonly USERS = {
    GET_ALL: '/Users',
    GET_BY_ID: (id: number) => `/Users/${id}`
  };

  // You can add more endpoint groups as needed

  // Generic methods for HTTP requests
  get<T>(url: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${url}`);
  }

  // Fixed duplicate post method by combining them
  post<T>(url: string, body: any, isFormData: boolean = false): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${url}`, body);
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${url}`, body);
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${url}`);
  }
}