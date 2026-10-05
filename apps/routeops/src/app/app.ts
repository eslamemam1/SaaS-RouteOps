import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
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
import { lucideChevronsLeft, lucideChevronsRight, lucideHouse, lucideMenu } from '@ng-icons/lucide';
import { injectText, LanguageService, productName } from '@routeops/shared/i18n';
import { LanguageSwitch, Logo } from '@routeops/shared/ui';
import { filter, map } from 'rxjs';
import { shellSections } from './shell-sections';
import { shellText } from './shell-text';

export const compactShellQuery = '(max-width: 899.98px)';
const sidebarStorageKey = 'routeops.sidebar';

@Component({
  imports: [LanguageSwitch, Logo, NgIcon, RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: { '(document:keydown.escape)': 'closeMenu()' },
})
export class App {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;
  private readonly direction = inject(LanguageService).direction;
  private readonly menuToggle = viewChild<ElementRef<HTMLButtonElement>>('menuToggle');
  private readonly sidebarToggle = viewChild<ElementRef<HTMLButtonElement>>('sidebarToggle');

  protected readonly text = injectText(shellText);
  protected readonly brand = injectText(productName);
  protected readonly sections = shellSections;
  protected readonly homeIcon = lucideHouse;
  protected readonly closeSidebarIcon = computed(() =>
    this.direction() === 'rtl' ? lucideChevronsRight : lucideChevronsLeft,
  );
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
  protected readonly openSidebarIcon = computed(() => {
    if (this.compact()) {
      return lucideMenu;
    }
    return this.direction() === 'rtl' ? lucideChevronsLeft : lucideChevronsRight;
  });
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
    } else {
      this.setSidebarHidden(!this.sidebarHidden());
    }
    this.focusToggle();
  }

  protected closeMenu(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      this.focusToggle();
    }
  }

  private focusToggle(): void {
    afterNextRender(
      () => {
        const target = this.sidebarVisible() ? this.sidebarToggle() : this.menuToggle();
        target?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  private setSidebarHidden(hidden: boolean): void {
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
