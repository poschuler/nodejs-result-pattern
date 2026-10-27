// Both versions declare the same UserRepository shape, so the repositories
// in this file serve either one.
import {
  RegisterUser,
  type RegisterUserError,
  type User,
  type UserRepository,
} from "./result/register-user.js";
import { InvalidEmailError } from "./throwing/email.js";
import {
  EmailTakenError,
  RegisterUserThrowing,
} from "./throwing/register-user.js";

// A database that is down: it throws, it does not return a Result.
const unreachable: UserRepository = {
  existsByEmail: () => Promise.reject(new Error("connection refused")),
  save: () => Promise.reject(new Error("connection refused")),
};

console.log("--- with exceptions ---");
const withExceptions = new RegisterUserThrowing(inMemoryRepository());

await registerWithExceptions(withExceptions, "Ada@Example.com");
// -> Registered ada@example.com
await registerWithExceptions(withExceptions, "not-an-email");
// -> Email must look like name@domain.tld
await registerWithExceptions(withExceptions, "ADA@example.com");
// -> That email is already registered
await registerWithExceptions(
  new RegisterUserThrowing(unreachable),
  "grace@example.com",
);
// -> Something went wrong, try again later
// -> (stderr) Error: connection refused

console.log("--- with Result ---");
const withResult = new RegisterUser(inMemoryRepository());

await registerWithResult(withResult, "Ada@Example.com");
// -> Registered ada@example.com
await registerWithResult(withResult, "not-an-email");
// -> Email must look like name@domain.tld
await registerWithResult(withResult, "ADA@example.com");
// -> That email is already registered
await registerWithResult(new RegisterUser(unreachable), "grace@example.com");
// -> Something went wrong, try again later
// -> (stderr) Error: connection refused

// execute() promises a User and says nothing about failing. Every failure,
// expected or not, arrives in the catch as `unknown`, and telling them apart
// is a chain of instanceof checks kept by hand: drop one and it still
// compiles, and that expected failure gets reported as unexpected.
async function registerWithExceptions(
  registerUser: RegisterUserThrowing,
  email: string,
): Promise<void> {
  try {
    const user = await registerUser.execute({ email });
    console.log(`Registered ${user.email.value}`);
  } catch (error) {
    if (error instanceof InvalidEmailError) {
      console.log(error.message);
    } else if (error instanceof EmailTakenError) {
      console.log("That email is already registered");
    } else {
      reportUnexpected(error);
    }
  }
}

// execute() names the failures it can return, and the value cannot be
// reached without checking `ok`. The expected failures never reach the
// catch, so all it has left to do is report the unexpected ones.
async function registerWithResult(
  registerUser: RegisterUser,
  email: string,
): Promise<void> {
  try {
    const result = await registerUser.execute({ email });

    if (!result.ok) {
      console.log(toMessage(result.error));
      return;
    }

    console.log(`Registered ${result.value.email.value}`);
  } catch (error) {
    reportUnexpected(error);
  }
}

// A new code in RegisterUserError stops this from compiling until it has a
// message here.
function toMessage(error: RegisterUserError): string {
  switch (error.code) {
    case "invalidEmail":
      return error.detail;
    case "emailTaken":
      return "That email is already registered";
  }
}

// A bug or the infrastructure failing: the person gets a generic message, and
// the details go where an operator will look.
function reportUnexpected(error: unknown): void {
  console.log("Something went wrong, try again later");
  console.error(String(error));
}

// Every call returns a fresh, empty store, so the two halves of this demo
// do not see each other's users.
function inMemoryRepository(): UserRepository {
  const users: User[] = [];

  return {
    existsByEmail: (email) =>
      Promise.resolve(users.some((user) => user.email.value === email.value)),
    save: (user) => {
      users.push(user);
      return Promise.resolve();
    },
  };
}
