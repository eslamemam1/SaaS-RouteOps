export class OrganizationAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrganizationAccessError';
  }
}
