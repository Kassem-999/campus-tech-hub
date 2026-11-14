import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Router } from '@angular/router';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'http://localhost:5000/api';
  readonly user = signal<User | null>(this.readUser());

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: User }>(`${this.baseUrl}/auth/login`, { email, password }).pipe(tap(result => this.setSession(result)));
  }

  register(fullName: string, email: string, password: string) {
    return this.http.post<{ token: string; user: User }>(`${this.baseUrl}/auth/register`, { full_name: fullName, email, password, role: 'student' }).pipe(tap(result => this.setSession(result)));
  }

  logout(): void {
    localStorage.removeItem('campus_token');
    localStorage.removeItem('campus_user');
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }

  isAuthenticated(): boolean { return Boolean(localStorage.getItem('campus_token')); }
  isAdmin(): boolean { return this.user()?.role === 'club_admin' || this.user()?.role === 'super_admin'; }

  private setSession(result: { token: string; user: User }): void {
    localStorage.setItem('campus_token', result.token);
    localStorage.setItem('campus_user', JSON.stringify(result.user));
    this.user.set(result.user);
  }

  private readUser(): User | null {
    try { return JSON.parse(localStorage.getItem('campus_user') || 'null') as User | null; } catch { return null; }
  }
}
