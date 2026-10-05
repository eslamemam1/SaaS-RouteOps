import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucideHouse, lucideMenu } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { LanguageSwitch } from '@routeops/shared/ui';
import { filter, map } from 'rxjs';
import { shellSections } from './shell-sections';
import { shellText } from './shell-text';

export const compactShellQuery = '(max-width: 899.98px)';
const sidebarStorageKey = 'routeops.sidebar';

@Component({
  imports: [LanguageSwitch, NgIcon, RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: { '(document:keydown.escape)': 'menuOpen.set(false)' },
})
export class App {
  private readonly router = inject(Router);
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;

  protected readonly text = injectText(shellText);
  protected readonly sections = shellSections;
  protected readonly homeIcon = lucideHouse;
  protected readonly menuIcon = lucideMenu;
  protected readonly menuOpen = signal(false);
  protected readonly sidebarHidden = signal(this.readSidebarHidden());
  private readonly compact = toSignal(
    inject(BreakpointObserver)
      .observe(compactShellQuery)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly sidebarVisible = computed(() =>
    this.compact() ? this.menuOpen() : !this.sidebarHidden(),
  );
  private readonly page = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.routerState.snapshot.root),
    ),
    { initialValue: null },
  );
  protected readonly showShell = computed(() => {
    const page = this.page();
    return page !== null && routeChain(page).every((route) => route.data['shell'] !== false);
  });
  protected readonly organizationId = computed(() => {
    const page = this.page();
    if (!page) {
      return null;
    }
    const route = routeChain(page).find((item) => item.paramMap.has('organizationId'));
    return route?.paramMap.get('organizationId') ?? null;
  });

  constructor() {
    effect(() => {
      this.page();
      untracked(() => this.menuOpen.set(false));
    });
  }

  protected toggleSidebar(): void {
    if (this.compact()) {
      this.menuOpen.update((open) => !open);
      return;
    }
    const hidden = !this.sidebarHidden();
    this.sidebarHidden.set(hidden);
    try {
      if (hidden) {
        this.storage?.setItem(sidebarStorageKey, 'hidden');
      } else {
        this.storage?.removeItem(sidebarStorageKey);
      }
    } catch {
      // Storage can be disabled; the choice then lasts until reload.
    }
  }

  private readSidebarHidden(): boolean {
    try {
      return this.storage?.getItem(sidebarStorageKey) === 'hidden';
    } catch {
      return false;
    }
  }
}

function routeChain(root: ActivatedRouteSnapshot): ActivatedRouteSnapshot[] {
  const chain = [root];
  let current = root.firstChild;
  while (current) {
    chain.push(current);
    current = current.firstChild;
  }
  return chain;
}
