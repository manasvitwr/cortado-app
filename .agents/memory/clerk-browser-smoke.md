---
name: Clerk browser smoke tests
description: Environment constraint for authenticated Playwright coverage.
---

Authenticated browser smoke tests need a real Clerk session artifact, such as a
Playwright storage state or the configured signup test credentials. Mocking the
product API is useful for deterministic profile failures and mutations, but it
does not make Clerk consider the browser signed in.

**Why:** Clerk owns the session transition outside the application API, and
there is no safe way to create a browser session from mocked profile responses.

**How to apply:** Keep authenticated tests opt-in with explicit test
credentials or storage state, while allowing the suite to discover and skip
cleanly in environments that do not have those artifacts. Use the environment
Chromium binary when the Playwright-managed browser is unavailable.