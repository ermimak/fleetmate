import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export declare enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
    AUTHORITY = "AUTHORITY",
    APPROVER = "APPROVER"
}
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    department: {
        id: string;
        name: string;
    };
    position: string;
}
export interface AuthResponse {
    access_token: string;
    user: User;
}
export declare class AuthService {
    private http;
    private apiUrl;
    private currentUserSubject;
    currentUser: Observable<User | null>;
    constructor(http: HttpClient);
    private getUserFromToken;
    get currentUserValue(): User | null;
    login(credentials: any): Observable<AuthResponse>;
    register(userInfo: any): Observable<User>;
    logout(): void;
    private storeToken;
    getToken(): string | null;
    isLoggedIn(): boolean;
    hasRole(allowedRoles: UserRole[]): boolean;
}
