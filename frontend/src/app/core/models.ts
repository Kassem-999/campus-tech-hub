export interface EventItem {
  id: number;
  title: string;
  description: string;
  category: string;
  venue: string;
  event_date: string;
  total_capacity: number;
  available_seats: number;
  popularity_score: number;
  club_name: string;
  ticket_id?: number;
  ticket_code?: string;
  ticket_status?: string;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  member_count: number;
  joined?: boolean;
}

export interface Ticket {
  id: number;
  ticket_code: string;
  title: string;
  venue: string;
  event_date: string;
  club_name: string;
  status: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'student' | 'club_admin' | 'super_admin';
  avatar_url?: string;
  bio?: string;
}
