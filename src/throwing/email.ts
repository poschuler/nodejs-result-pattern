export class InvalidEmailError extends Error {
  public override readonly name = "InvalidEmailError";
}

const EMAIL_PATTERN = /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)+$/;

export class Email {
  private constructor(public readonly value: string) {}

  public static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();

    if (normalized === "") {
      throw new InvalidEmailError("Email is required");
    }

    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError("Email must look like name@domain.tld");
    }

    return new Email(normalized);
  }
}
