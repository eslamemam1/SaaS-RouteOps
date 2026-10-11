import { DOCUMENT, inject, Injectable, signal } from '@angular/core';

const storageKey = 'routeops.organization';

// The organization the app shell's sidebar links to, so its sections show on
// pages whose address names no organization, such as the dashboard. The
// browser remembers it; it is only a shortcut, and row level security still
// decides what a member may open.
@Injectable({ providedIn: 'root' })
export class ShellOrganization {
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;
  private readonly current = signal<string | null>(this.read());

  readonly id = this.current.asReadonly();

  set(id: string | null): void {
    if (id === this.current()) {
      return;
    }
    this.current.set(id);
    try {
      if (id) {
        this.storage?.setItem(storageKey, id);
      } else {
        this.storage?.removeItem(storageKey);
      }
    } catch {
      // A browser that refuses storage keeps the choice for this visit only.
    }
  }

  private read(): string | null {
    try {
      return this.storage?.getItem(storageKey) || null;
    } catch {
      return null;
    }
  }
}
