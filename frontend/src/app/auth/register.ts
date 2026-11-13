import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({ standalone: true, imports: [FormsModule, RouterLink], template: `<main class="auth-page"><section class="auth-card"><div class="auth-brand">✦ CampusHub</div><h1>Create account</h1><p>Join the campus technology community.</p><form class="auth-form" (ngSubmit)="submit()"><label>Full name<input name="fullName" [(ngModel)]="fullName" required></label><label>Email<input name="email" type="email" [(ngModel)]="email" required></label><label>Password<input name="password" type="password" [(ngModel)]="password" minlength="8" required></label><label>Account type<select name="role" [(ngModel)]="role"><option value="student">Student</option><option value="club_admin">Club admin</option></select></label>@if(error()) {<span class="auth-error">{{ error() }}</span>}<button type="submit">Create account</button></form><a class="auth-link" routerLink="/login">Already have an account? Sign in</a></section></main>`, styleUrl: './auth.css' })
export class Register {
  private readonly auth = inject(AuthService); private readonly router = inject(Router);
  fullName = ''; email = ''; password = ''; role: 'student' | 'club_admin' = 'student'; readonly error = signal('');
  submit(): void { this.auth.register(this.fullName, this.email, this.password, this.role).subscribe({ next: () => this.router.navigateByUrl('/dashboard'), error: error => this.error.set(error.error?.message || 'Unable to register') }); }
}
