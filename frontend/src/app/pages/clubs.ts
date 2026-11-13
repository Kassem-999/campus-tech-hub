import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Club } from '../core/models';

@Component({
  standalone: true,
  template: `<section class="page-panel"><div class="panel-head"><div><h2>Tech clubs</h2><p>Find a community to build, learn and collaborate with.</p></div></div><div class="club-grid">@for (club of clubs(); track club.id) {<article class="club-card"><div class="club-logo large-logo">{{ club.name.charAt(0) }}</div><h3>{{ club.name }}</h3><p>{{ club.description }}</p><div class="club-footer"><span>{{ club.member_count }} members</span><button class="reserve" (click)="toggle(club)">{{ club.joined ? 'Leave club' : 'Join club' }}</button></div></article>}</div></section>`,
  styleUrl: './pages.css'
})
export class ClubsPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly clubs = signal<Club[]>([]);
  ngOnInit(): void { this.api.clubs().subscribe(value => this.clubs.set(value)); }
  toggle(club: Club): void { const request = club.joined ? this.api.leaveClub(club.id) : this.api.joinClub(club.id); request.subscribe(() => { club.joined = !club.joined; this.clubs.update(items => [...items]); }); }
}
