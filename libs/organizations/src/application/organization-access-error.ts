import { CompanyAccountProblem } from '../domain/company-account';

export class OrganizationAccessError extends Error {
  constructor(readonly problem: CompanyAccountProblem) {
    super(problem);
    this.name = 'OrganizationAccessError';
  }
}
