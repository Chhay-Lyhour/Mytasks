<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## PostgreSQL configuration

Install PostgreSQL and create a database named `mytasks`. Copy `.env.example` to
`.env`, then set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, and `DB_PASSWORD` to match
your local PostgreSQL installation. Replace `JWT_SECRET` with a long random
secret and keep it private. The `.env` file is ignored by Git; only the
fake-value template should be committed.

The app loads these values through `ConfigModule` and configures its PostgreSQL
connection with `TypeOrmModule`. Schema synchronization is disabled; database
tables are managed with TypeORM migrations. Tasks are stored in the PostgreSQL
`tasks` table and registered accounts are stored in the `users` table, so they
remain available after the application restarts.

## Authentication

All API routes are under `/api` and are protected by a global auth guard unless
they are marked public (`signup`, `login`, `refresh`, and `logout`).

Register an account with `POST /api/auth/signup` (also available as
`POST /api/auth/register`):

```json
{
  "email": "alice@test.dev",
  "password": "secret123"
}
```

Registration returns `{ "id": 1, "email": "alice@test.dev" }`. Passwords are
stored as bcrypt hashes and are never included in API responses. Registering an
email that already exists returns `409 Conflict`.

Log in with `POST /api/auth/login` using the same JSON fields. A successful
login returns `{ "accessToken": "..." }` and sets a rotated refresh token in an
HttpOnly cookie. An incorrect email/password returns `401` with
`Invalid credentials`.

`GET /api/todos` requires a Bearer access token and returns only the signed-in
user's to-dos. `GET /api/todos/:id` returns `404` if the to-do belongs to
someone else.

Refresh the access token with `POST /api/auth/refresh` (cookie-based, rotated).
Revoke it with `POST /api/auth/logout`.

A small React client lives in `web/`. It keeps the access token in memory and
uses an axios interceptor to call `/api/auth/refresh` on `401`. Run it with
`npm run start:web` while the API is on port 3000.

## Run the auth and authorization lab

Apply any pending database migrations:

```bash
npm run migration:run
```

Start the API in one terminal and the React UI in another:

```bash
npm run start:dev
```

```bash
npm run start:web
```

Open <http://localhost:5173>. Sign up Alice, add a to-do, log out, and sign up
Bob. Each account should see only its own to-dos. For an API-level check, run
`npm run test:e2e`; it verifies signup, duplicate-email rejection, bad-password
rejection, unauthenticated access, cross-user to-do isolation, refresh-token
rotation, and logout.

The matching Postman Runner collection is
[`postman/MyTasks-AuthZ-Lab.postman_collection.json`](./postman/MyTasks-AuthZ-Lab.postman_collection.json).
Import it, keep `baseUrl` set to `http://localhost:3000/api`, select the
Desktop Agent, and run the collection to exercise the same two-user flow.

The API1/Broken Object Level Authorization risk is cross-user access through a
to-do ID. To prevent it, every to-do query includes the authenticated user's
`ownerId`; the e2e suite checks that Alice receives `404` for Bob's to-do. The
refresh endpoint also consumes tokens with a conditional database update so
simultaneous requests cannot both rotate the same token.

Run TypeORM migrations from the project root:

```bash
npm run migration:run
npm run migration:revert
```

Generate a migration after changing an entity:

```bash
npm run migration:generate -- src/migrations/DescribeYourChange
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

This project is already instrumented. To connect it, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It writes the app key and secret into `.env` and makes every `nest start` script (`start`, `start:dev`, `start:debug`) load it. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand: create an application and an API key at [observe.nestjs.com](https://observe.nestjs.com), and set the pair as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment the app runs in.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Mytasks
