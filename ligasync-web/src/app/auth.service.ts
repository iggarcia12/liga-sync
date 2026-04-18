import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  constructor(private router: Router) {}

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRol(): string | null {
    return localStorage.getItem('rol');
  }

  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }

  getNombre(): string | null {
    return localStorage.getItem('nombre');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const rol = this.getRol();
    const normalized = rol ? rol.toUpperCase() : '';
    return normalized === 'ADMIN' || normalized === 'ROLE_ADMIN';
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('userId');
    localStorage.removeItem('nombre');
    this.router.navigate(['/login']);
  }
}
