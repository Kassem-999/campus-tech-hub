import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { EventItem } from '../core/models';

@Component({
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <section class="page-panel"><div class="panel-head"><div><h2>Discover events</h2><p>Search workshops, hackathons and talks.</p></div>@if (auth.isAdmin()) {<a class="primary-button" routerLink="/dashboard/events/new">+ Create event</a>}</div>
      <div class="filter-bar"><input placeholder="Search events, venues..." [(ngModel)]="search" (ngModelChange)="searchChanged($event)"><select [(ngModel)]="category" (ngModelChange)="load()"><option value="">All categories</option>@for (item of categories; track item) {<option [value]="item">{{ item.replace('_', ' ') }}</option>}</select><input type="date" [(ngModel)]="date" (ngModelChange)="load()"><select [(ngModel)]="sort" (ngModelChange)="load()"><option value="date">Soonest</option><option value="popularity">Most popular</option></select></div>
      @if (notice()) {<div class="notice">{{ notice() }}</div>}
      <div class="event-grid">@for (event of events(); track event.id) {<article class="event-card"><div class="card-top"><span class="badge">{{ event.category.replace('_', ' ') }}</span><span class="seat-count">{{ event.available_seats }} seats</span></div><h3>{{ event.title }}</h3><p>{{ event.description }}</p><small>{{ event.club_name }} · {{ event.venue }}</small><div class="event-card-footer"><span>{{ event.event_date | date:'EEE, MMM d · h:mm a' }}</span><button class="reserve" [disabled]="event.available_seats < 1" (click)="book(event)">{{ event.available_seats ? 'Book ticket' : 'Sold out' }}</button></div></article>} @empty {<p class="empty">No events match your filters.</p>}</div>
    </section>
  `,
  styleUrl: './pages.css'
})
export class EventsPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly events = signal<EventItem[]>([]);
  readonly notice = signal('');
  readonly categories = ['workshop', 'hackathon', 'guest_speaker', 'other'];
  search = ''; category = ''; date = ''; sort = 'date';
  private readonly search$ = new Subject<string>();
  ngOnInit(): void { this.load(); this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => this.load()); }
  searchChanged(value: string): void { this.search$.next(value); }
  load(): void { this.api.events(this.search, this.category, this.sort, this.date).subscribe(value => this.events.set(value)); }
  book(event: EventItem): void { this.api.book(event.id).subscribe({ next: result => { this.notice.set(`Ticket ${result.ticketCode} created`); this.load(); }, error: error => this.notice.set(error.error?.message || 'Unable to book ticket') }); }
}
