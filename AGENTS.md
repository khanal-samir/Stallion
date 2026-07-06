# Testing requirements

- Keep API tests under `apps/api/test`; never colocate tests in `apps/api/src`.
- Keep web tests under `apps/web/test`; never colocate tests in `apps/web/app`, `components`, `hooks`, `lib`, `services`, or `store`.
- Add or update tests whenever runtime code changes. This includes utilities, middleware, hooks, services, stores, components, pages, route wiring, and configuration.
- New behavior must cover success, failure, validation, and relevant edge cases.
- Use deterministic Faker factories or explicit fixture values. Do not depend on random data or test execution order.
- Preserve the 100% statements, branches, functions, and lines thresholds for the DB-free coverage boundary defined in each app's `vitest.config.ts`.
- Do not weaken coverage thresholds or add coverage exclusions merely to make CI pass. Document any legitimate infrastructure exclusion in the relevant Vitest configuration.
- Run the affected app's tests, coverage, type checks, and lint before considering work complete.
