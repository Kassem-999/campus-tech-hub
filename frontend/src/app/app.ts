import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Campus Tech Hub');
  private readonly router = inject(Router);
  private readonly browserTitle = inject(Title);

  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.updateBrowserTitle());
    this.updateBrowserTitle();
  }

  private updateBrowserTitle(): void {
    let route = this.router.routerState.root;
    while (route.firstChild) route = route.firstChild;
    this.browserTitle.setTitle(`CampusHub - ${route.snapshot.data['title'] || 'Dashboard'}`);
  }
}
