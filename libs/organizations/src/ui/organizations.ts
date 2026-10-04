import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { companyAccountMessages } from '../domain/company-account';
import { activeOrganization, Organization } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { ProvisionCompanyForm } from './provision-company';

@Component({
  selector: 'app-organizations',
  imports: [ProvisionCompanyForm],
  templateUrl: './organizations.html',
})
export class Organizations {
  private readonly repository = inject(OrganizationRepository);
  private readonly router = inject(Router);

  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly message = signal('');
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly active = signal<Organization | null>(null);
  protected readonly operator = signal(false);

  constructor() {
    void this.load();
  }

  protected choose(organizationId: string): void {
    this.active.set(activeOrganization(this.organizations(), organizationId));
  }

  protected async signOut(): Promise<void> {
    await this.repository.signOut();
    await this.router.navigateByUrl('/sign-in');
  }

  protected async reload(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    try {
      const organizations = await this.repository.listMine();
      this.organizations.set(organizations);
      this.operator.set(await this.repository.currentUserIsOperator());
      this.active.set(activeOrganization(organizations, null));
      this.status.set(organizations.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.message.set(
        error instanceof OrganizationAccessError
          ? error.message
          : companyAccountMessages.load,
      );
      this.status.set('error');
    }
  }
}
