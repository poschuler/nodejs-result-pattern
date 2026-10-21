# Node.js Result Pattern

Companion code for a post on [poschuler.com](https://poschuler.com) about the **Result pattern**
in TypeScript. One use case, registering a user, is written twice — once with exceptions and once
with `Result` — so the two can be read side by side.

No library, no `map` or `andThen`: a `Result` is a discriminated union on `ok`, and that is all
this repository needs to make its point.

## The Two Rules

- **Expected failures are returned.** An invalid email or an address already taken are part of
  the domain. They appear in the signature as a typed `Result`, and the value cannot be reached
  without checking `ok`.
- **Bugs and infrastructure failures are thrown.** A database that is down is not something the
  use case can promise anything about. It still throws, and it is handled once, at the edge.

The edge of the application decides what a failure means to whoever is on the other side: a line
on the console here, a status code in an API, a message in a queue elsewhere. Nothing in the
pattern is specific to HTTP.

## Run It

Requires **Node.js v24 or higher** and **pnpm** (the project pins `pnpm@12.14.0` via the
`packageManager` field).

```bash
git clone https://github.com/poschuler/nodejs-result-pattern.git
cd nodejs-result-pattern
pnpm install
pnpm start
```

```
--- with exceptions ---
Registered ada@example.com
Email must look like name@domain.tld
That email is already registered
Something went wrong, try again later
Error: connection refused
--- with Result ---
Registered ada@example.com
Email must look like name@domain.tld
That email is already registered
Something went wrong, try again later
Error: connection refused
```

The output is identical on purpose. The difference is not what the caller can do, but what it has
to know and who checks that it knows it.

## The Files

| File                                                             | What it holds                                                                                       |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`src/result.ts`](src/result.ts)                                 | `Success<T>`, `Failure<E>`, `Result<T, E>`, and the two factories that build them                   |
| [`src/email.ts`](src/email.ts)                                   | The `Email` value object, whose `create()` reports invalid input as a `Result<Email, EmailError>`   |
| [`src/register-user.ts`](src/register-user.ts)                   | The use case with `Result`: `execute()` returns `Promise<Result<User, RegisterUserError>>`          |
| [`src/register-user.throwing.ts`](src/register-user.throwing.ts) | The same use case with the same rules, reporting its expected failures as exceptions                |
| [`src/app.ts`](src/app.ts)                                       | The runnable comparison. Each `console.log` carries a `// ->` comment with the exact line it prints |

## Worth a Second Look

- **The `catch` blocks.** With exceptions, the `catch` receives every failure as `unknown` and
  separates them with a chain of `instanceof` checks kept by hand. Drop one and it still compiles,
  and an invalid email gets reported as an unexpected error. With `Result`, the expected failures
  never reach the `catch`, so the only thing left in it is the report of the unexpected ones.
- **`toMessage()` is exhaustive.** Add a code to `RegisterUserError` and `toMessage()` stops
  compiling (`TS2366`), and oxlint's `switch-exhaustiveness-check` flags the missing case. The
  `switch` also narrows the union, so `error.detail` is only reachable for `invalidEmail`.
- **The `unreachable` repository.** Both use cases receive a repository that rejects every call.
  Neither turns that into a `Result`: it is thrown, and the same `reportUnexpected()` handles it
  in both halves. `Result` does not replace exceptions; it takes the expected failures out of
  them.
- **`reportUnexpected()` is a global error handler in disguise.** In an API, the per-call
  `try/catch` disappears from the routes and becomes one handler written once — Express's
  four-argument error middleware, or Fastify's `setErrorHandler`. The routes keep only the
  `if (!result.ok)`.

## Deliberately Left Out

- **Tests and CI.** The guarantees this repository is about are checked at compile time.
  `pnpm check` runs formatting, linting and type-checking, which is where they would break.
- **`map`, `andThen` and friends.** Chaining helpers are what libraries such as
  [neverthrow](https://github.com/supermacro/neverthrow) add on top of the same idea. The plain
  `if (!result.ok)` keeps the mechanism visible.
- **A server.** The pattern is not about HTTP, and a console app shows it with less around it.

## Commands

| Command                             | What it does                                       |
| ----------------------------------- | -------------------------------------------------- |
| `pnpm start`                        | Runs `src/app.ts` via `tsx`                        |
| `pnpm check`                        | Format check, lint and type-check, in that order   |
| `pnpm typecheck`                    | Type-checks `src` without emitting                 |
| `pnpm lint` / `pnpm lint:fix`       | oxlint with type-aware rules, reporting or writing |
| `pnpm format` / `pnpm format:check` | oxfmt, writing or checking                         |

## License

[MIT](LICENSE)
