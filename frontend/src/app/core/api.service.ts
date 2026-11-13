import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Club, EventItem, Ticket } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5000/api';

  events(query = '', category = '', sort = 'date', date = ''): Observable<EventItem[]> {
    let params = new HttpParams().set('sort', sort);
    if (query) params = params.set('q', query);
    if (category) params = params.set('category', category);
    if (date) params = params.set('date', date);
    return this.http.get<EventItem[]>(`${this.baseUrl}/events`, { params });
  }

  clubs(): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.baseUrl}/clubs`);
  }

  tickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.baseUrl}/tickets/my`);
  }

  book(eventId: number): Observable<{ ticketCode: string }> {
    return this.http.post<{ ticketCode: string }>(`${this.baseUrl}/tickets`, { eventId });
  }

  cancel(ticketId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/tickets/${ticketId}/cancel`, {});
  }

  joinClub(clubId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/clubs/${clubId}/join`, {});
  }

  leaveClub(clubId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clubs/${clubId}/leave`);
  }

  profile(): Observable<import('./models').User> {
    return this.http.get<import('./models').User>(`${this.baseUrl}/users/profile`);
  }

  updateProfile(payload: { full_name: string; bio: string; avatar_url: string }): Observable<import('./models').User> {
    return this.http.put<import('./models').User>(`${this.baseUrl}/users/profile`, payload);
  }

  createEvent(payload: Record<string, unknown>): Observable<EventItem> {
    return this.http.post<EventItem>(`${this.baseUrl}/events`, payload);
  }
}
