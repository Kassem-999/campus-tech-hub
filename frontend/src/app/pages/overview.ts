import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Club, EventItem, Ticket } from '../core/models';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <section class="stats">
      <article class="stat-card green"><div class="stat-icon">◈</div><span>EVENTS ATTENDING</span><strong>{{ tickets().length }}</strong><small>Active digital passes</small></article>
      <article class="stat-card gold"><div class="stat-icon">◷</div><span>AVAILABLE EVENTS</span><strong>{{ events().length }}</strong><small>Across all clubs</small></article>
      <article class="stat-card purple"><div class="stat-icon">◎</div><span>TECH CLUBS</span><strong>{{ clubs().length }}</strong><small>Find your community</small></article>
      <article class="stat-card blue"><div class="stat-icon">✓</div><span>SEATS RESERVED</span><strong>{{ tickets().length }}</strong><small>Keep discovering</small></article>
    </section>
    <section class="page-panel"><div class="panel-head"><div><h2>Upcoming events</h2><p>Fresh experiences from your campus community.</p></div><a class="link-button" routerLink="/dashboard/events">Explore all →</a></div>
      @for (event of events().slice(0, 4); track event.id) {<div class="compact-row"><div class="event-date"><strong>{{ event.event_date | date:'dd' }}</strong><span>{{ event.event_date | date:'MMM' }}</span></div><div><h4>{{ event.title }}</h4><small>{{ event.club_name }} · {{ event.venue }} · {{ event.available_seats }} seats left</small></div><span class="badge">{{ event.category.replace('_', ' ') }}</span></div>} @empty {<p class="empty">No upcoming events found. Run the backend seed script.</p>}
    </section>
    <section class="page-panel"><div class="panel-head"><div><h2>Active digital passes</h2><p>Your next campus check-ins.</p></div><a class="link-button" routerLink="/dashboard/tickets">View tickets →</a></div>
      @for (ticket of tickets().slice(0, 2); track ticket.id) {<div class="compact-row"><div class="ticket-code">{{ ticket.ticket_code }}</div><div><h4>{{ ticket.title }}</h4><small>{{ ticket.event_date | date:'MMM d, h:mm a' }} · {{ ticket.venue }}</small></div><span class="status confirmed">{{ ticket.status }}</span></div>} @empty {<p class="empty">Book an event to create your first pass.</p>}
    </section>
  `,
  styleUrl: './pages.css'
})
export class Overview implements OnInit {
  private readonly api = inject(ApiService);
  readonly events = signal<EventItem[]>([]);
  readonly clubs = signal<Club[]>([]);
  readonly tickets = signal<Ticket[]>([]);
  ngOnInit(): void {
    this.api.events().subscribe(value => this.events.set(value));
    this.api.clubs().subscribe(value => this.clubs.set(value));
    this.api.tickets().subscribe(value => this.tickets.set(value));
  }
}
