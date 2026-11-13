import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `<section class="page-panel settings-panel"><div class="panel-head"><div><h2>Profile settings</h2><p>Keep your CampusHub identity up to date.</p></div></div><form (ngSubmit)="save()"><label>Full name<input name="full_name" [(ngModel)]="form.full_name" required></label><label>Avatar URL<input name="avatar_url" [(ngModel)]="form.avatar_url" placeholder="https://..."></label><label>Bio<textarea name="bio" [(ngModel)]="form.bio" placeholder="Tell clubs what you are interested in"></textarea></label><button class="primary-button" type="submit">Save changes</button>@if (notice()) {<span class="success">{{ notice() }}</span>}</form></section>`,
  styleUrl: './pages.css'
})
export class SettingsPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly notice = signal('');
  form = { full_name: '', bio: '', avatar_url: '' };
  ngOnInit(): void { this.api.profile().subscribe(user => this.form = { full_name: user.full_name, bio: user.bio || '', avatar_url: user.avatar_url || '' }); }
  save(): void { this.api.updateProfile(this.form).subscribe(user => { this.form = { full_name: user.full_name, bio: user.bio || '', avatar_url: user.avatar_url || '' }; this.notice.set('Profile updated'); }); }
}
