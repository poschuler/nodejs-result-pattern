import { Result } from "./result.js";

export type EmailError = {
  readonly code: "invalidEmail";
  readonly detail: string;
};

const EMAIL_PATTERN = /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)+$/;

export class Email {
  private constructor(public readonly value: string) {}

  public static create(raw: string): Result<Email, EmailError> {
    const normalized = raw.trim().toLowerCase();

    if (normalized === "") {
      return Result.failure({
        code: "invalidEmail",
        detail: "Email is required",
      });
    }

    if (!EMAIL_PATTERN.test(normalized)) {
      return Result.failure({
        code: "invalidEmail",
        detail: "Email must look like name@domain.tld",
      });
    }

    return Result.success(new Email(normalized));
  }
}
