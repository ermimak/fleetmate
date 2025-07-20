"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.UserRole = void 0;
const core_1 = require("@angular/core");
const http_1 = require("@angular/common/http");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["AUTHORITY"] = "AUTHORITY";
    UserRole["APPROVER"] = "APPROVER";
})(UserRole || (exports.UserRole = UserRole = {}));
let AuthService = class AuthService {
    constructor(http) {
        this.http = http;
        this.apiUrl = 'http://localhost:3000/api/auth';
        this.currentUserSubject = new rxjs_1.BehaviorSubject(this.getUserFromToken());
        this.currentUser = this.currentUserSubject.asObservable();
    }
    getUserFromToken() {
        const token = this.getToken();
        if (!token)
            return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
                firstName: '',
                lastName: '',
                department: { id: payload.department, name: '' },
                position: ''
            };
        }
        catch (e) {
            console.error('Error decoding token', e);
            return null;
        }
    }
    get currentUserValue() {
        return this.currentUserSubject.value;
    }
    login(credentials) {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe((0, operators_1.tap)(response => {
            this.storeToken(response.access_token);
            this.currentUserSubject.next(response.user);
        }));
    }
    register(userInfo) {
        return this.http.post(`${this.apiUrl}/register`, userInfo);
    }
    logout() {
        localStorage.removeItem('access_token');
        this.currentUserSubject.next(null);
    }
    storeToken(token) {
        localStorage.setItem('access_token', token);
    }
    getToken() {
        return localStorage.getItem('access_token');
    }
    isLoggedIn() {
        return !!this.getToken();
    }
    hasRole(allowedRoles) {
        const user = this.currentUserValue;
        if (!user)
            return false;
        return allowedRoles.includes(user.role);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, core_1.Injectable)({
        providedIn: 'root'
    }),
    __metadata("design:paramtypes", [http_1.HttpClient])
], AuthService);
//# sourceMappingURL=auth.service.js.map