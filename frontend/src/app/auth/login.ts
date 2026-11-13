import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({ standalone: true, imports: [FormsModule, RouterLink], template: `<main class="auth-page"><section class="auth-card"><div class="auth-brand">✦ CampusHub</div><h1>Welcome back</h1><p>Sign in to discover your next campus experience.</p><form class="auth-form" (ngSubmit)="submit()"><label>Email<input name="email" type="email" [(ngModel)]="email" required></label><label>Password<input name="password" type="password" [(ngModel)]="password" required></label>@if(error()) {<span class="auth-error">{{ error() }}</span>}<button type="submit">Sign in</button></form><a class="auth-link" routerLink="/register">New here? Create an account</a></section></main>`, styleUrl: './auth.css' })
export class Login {
  private readonly auth = inject(AuthService); private readonly router = inject(Router);
  email = 'student@campus.test'; password = 'Campus123!'; readonly error = signal('');
  submit(): void { this.auth.login(this.email, this.password).subscribe({ next: () => this.router.navigateByUrl('/dashboard'), error: error => this.error.set(error.error?.message || 'Unable to sign in') }); }
}
