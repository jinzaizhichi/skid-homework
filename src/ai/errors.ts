export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableError";
    Object.setPrototypeOf(this, NonRetryableError.prototype);
  }
}

export function isNonRetryableError(
  error: unknown,
): error is NonRetryableError {
  return error instanceof NonRetryableError;
}
