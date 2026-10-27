import { Email } from "./email.js";

export type User = {
  readonly email: Email;
};

export type UserRepository = {
  existsByEmail(email: Email): Promise<boolean>;
  save(user: User): Promise<void>;
};

export type RegisterUserInput = {
  readonly email: string;
};

export class EmailTakenError extends Error {
  public override readonly name = "EmailTakenError";

  public constructor() {
    super("Email is already registered");
  }
}

// Both expected failures, an invalid email and an address already taken,
// leave through the same door as a database that is down.
export class RegisterUserThrowing {
  public constructor(private readonly users: UserRepository) {}

  public async execute(input: RegisterUserInput): Promise<User> {
    const email = Email.create(input.email);

    if (await this.users.existsByEmail(email)) {
      throw new EmailTakenError();
    }

    const user: User = { email };
    await this.users.save(user);

    return user;
  }
}
