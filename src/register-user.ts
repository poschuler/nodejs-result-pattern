import { Email, type EmailError } from "./email.js";
import { Result } from "./result.js";

export type User = {
  readonly email: Email;
};

export type UserRepository = {
  existsByEmail(email: Email): Promise<boolean>;
  save(user: User): Promise<void>;
};

export type RegisterUserError = EmailError | { readonly code: "emailTaken" };

export type RegisterUserInput = {
  readonly email: string;
};

export class RegisterUser {
  public constructor(private readonly users: UserRepository) {}

  public async execute(
    input: RegisterUserInput,
  ): Promise<Result<User, RegisterUserError>> {
    const email = Email.create(input.email);

    if (!email.ok) {
      // A Failure carries no value, so it is already a valid
      // Result<User, RegisterUserError> and goes back up unchanged.
      return email;
    }

    if (await this.users.existsByEmail(email.value)) {
      return Result.failure({ code: "emailTaken" });
    }

    const user: User = { email: email.value };
    await this.users.save(user);

    return Result.success(user);
  }
}
