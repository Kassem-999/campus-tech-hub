import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-event-wizard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './event-wizard.html',
  styleUrl: './event-wizard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventWizard {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly step = signal(1);
  readonly error = signal('');
  readonly form = {
    title: '', description: '', category: 'workshop', venue: '', eventDate: '',
    totalCapacity: 50, bannerUrl: '', clubId: 1
  };

  next(): void {
    if (this.step() < 3) this.step.update(value => value + 1);
  }

  previous(): void {
    if (this.step() > 1) this.step.update(value => value - 1);
  }

  submit(): void {
    this.error.set('');
    this.api.createEvent(this.form).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: error => this.error.set(error.error?.message || 'Could not publish event')
    });
  }
}
