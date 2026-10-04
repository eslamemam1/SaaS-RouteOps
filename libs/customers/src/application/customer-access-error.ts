export class CustomerAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomerAccessError';
  }
}
