import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  AUTHORITY = 'AUTHORITY',
  APPROVER = 'APPROVER',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: { id: string; name: string };
  position: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; 
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromToken());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  private getUserFromToken(): User | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // This is a simplified user object from the token payload
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        firstName: '', // These details are not in the token, but we can fetch them if needed
        lastName: '',
        department: { id: payload.department, name: '' },
        position: ''
      };
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.storeToken(response.access_token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(userInfo: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userInfo);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
  }

  private storeToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(allowedRoles: UserRole[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }
}
