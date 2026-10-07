import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { injectText } from '@routeops/shared/i18n';
import { Button, PageState } from '@routeops/shared/ui';
import { CompanyAccountProblem } from '../domain/company-account';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { organizationsText } from './organizations-text';

@Component({
  selector: 'app-sign-out',
  imports: [Button, PageState, RouterLink],
  template: `
    @if (problem(); as problem) {
      <app-page-state kind="error" [message]="text().problems[problem]">
        <div class="ro-toolbar">
          <button appButton type="button" (click)="signOut()">
            {{ text().signOut.retry }}
          </button>
          <a appButton="secondary" routerLink="/dashboard">{{ text().signOut.backHome }}</a>
        </div>
      </app-page-state>
    } @else {
      <app-page-state kind="loading" [message]="text().signOut.busy" />
    }
  `,
  styleUrl: './sign-out.css',
})
export class SignOut {
  private readonly repository = inject(OrganizationRepository);
  private readonly router = inject(Router);

  protected readonly text = injectText(organizationsText);
  protected readonly problem = signal<CompanyAccountProblem | null>(null);

  constructor() {
    void this.signOut();
  }

  protected async signOut(): Promise<void> {
    this.problem.set(null);
    try {
      await this.repository.signOut();
    } catch (error) {
      this.problem.set(
        error instanceof OrganizationAccessError ? error.problem : 'signOut',
      );
      return;
    }
    await this.router.navigateByUrl('/sign-in', { replaceUrl: true });
  }
}
