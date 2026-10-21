import { Email } from "./email.js";
import type {
  RegisterUserInput,
  User,
  UserRepository,
} from "./register-user.js";

export class InvalidEmailError extends Error {
  public override readonly name = "InvalidEmailError";
}

export class EmailTakenError extends Error {
  public override readonly name = "EmailTakenError";

  public constructor() {
    super("Email is already registered");
  }
}

// The same use case as RegisterUser, with the same rules. Only the way it
// reports a failure changes: execute() promises a User, and the two expected
// failures leave through the same door as a database that is down.
// Email.create() returns a Result; this version turns it back into a throw.
export class RegisterUserThrowing {
  public constructor(private readonly users: UserRepository) {}

  public async execute(input: RegisterUserInput): Promise<User> {
    const email = Email.create(input.email);

    if (!email.ok) {
      throw new InvalidEmailError(email.error.detail);
    }

    if (await this.users.existsByEmail(email.value)) {
      throw new EmailTakenError();
    }

    const user: User = { email: email.value };
    await this.users.save(user);

    return user;
  }
}
