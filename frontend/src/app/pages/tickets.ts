import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { Ticket } from '../core/models';

@Component({
  standalone: true,
  imports: [DatePipe],
  template: `<section class="page-panel"><div class="panel-head"><div><h2>My digital passes</h2><p>Show your ticket code at the venue entrance.</p></div><span class="muted">{{ tickets().length }} passes</span></div><div class="ticket-grid">@for (ticket of tickets(); track ticket.id) {<article class="pass-card"><div class="pass-header"><span>CampusHub pass</span><span class="status" [class.cancelled]="ticket.status === 'cancelled'">{{ ticket.status }}</span></div><div class="qr">{{ ticket.ticket_code.slice(-4) }}</div><h3>{{ ticket.title }}</h3><p>{{ ticket.club_name }}</p><div class="pass-meta"><span>{{ ticket.event_date | date:'MMM d, y · h:mm a' }}</span><span>{{ ticket.venue }}</span></div><strong class="pass-code">{{ ticket.ticket_code }}</strong>@if (ticket.status === 'confirmed') {<button class="cancel-button" (click)="cancel(ticket)">Cancel ticket</button>}</article>} @empty {<p class="empty">No tickets yet. Discover an event to get started.</p>}</div></section>`,
  styleUrl: './pages.css'
})
export class TicketsPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly tickets = signal<Ticket[]>([]);
  ngOnInit(): void { this.load(); }
  load(): void { this.api.tickets().subscribe(value => this.tickets.set(value)); }
  cancel(ticket: Ticket): void { this.api.cancel(ticket.id).subscribe(() => this.load()); }
}
