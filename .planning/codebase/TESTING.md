# Testing Patterns

**Analysis Date:** 2026-01-22

## Test Framework

**Runner:**
- Vitest 4.0.17
- Config: `vitest.config.ts`
- Environment: happy-dom (lightweight DOM simulation)

**Assertion Library:**
- Vitest built-in assertions (expect)

**Run Commands:**
```bash
npm run test              # Run tests in watch mode
npm run test:run          # Run tests once (CI mode)
npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:ui       # Run E2E tests with Playwright UI
```

## Test File Organization

**Location:**
- Unit/integration tests: co-located in `tests/` directory at project root
- Structure: `tests/unit/` and `tests/e2e/` subdirectories

**Naming:**
- Pattern: `*.test.ts` or `*.test.tsx` for Vitest
- Pattern: `*.spec.ts` for Playwright E2E tests
- Examples: `auth.test.ts`, `auth.spec.ts`

**Structure:**
```
tests/
├── unit/
│   └── validations/
│       └── auth.test.ts
├── e2e/
│   └── auth.spec.ts
└── setup.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe("signUpSchema", () => {
  it("should accept valid input", () => {
    // test code
  });

  it("should reject invalid input", () => {
    // test code
  });
});

describe("Form Validation", () => {
  // grouped related tests
});
```

**Patterns:**
- Top-level `describe()` blocks for grouping related tests
- `it()` for individual test cases
- Descriptive test names starting with "should"
- No explicit setup/teardown detected; tests are isolated via Zod validation testing

## Mocking

**Framework:** Not detected in current test suite

**Patterns:**
- No explicit mocking in unit tests (schema validation tests use pure functions)
- Playwright E2E tests interact with real browser/server

**What to Mock:**
- External API calls (when needed)
- Database operations (when testing services)

**What NOT to Mock:**
- Zod schema validation (test schemas directly)
- Form handling (test through React components in E2E)
- Core business logic (test with real implementations)

## Fixtures and Factories

**Test Data:**
- Inline test data in test cases
- Pattern: Create simple objects directly in tests
```typescript
const result = signUpSchema.safeParse({
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  confirmPassword: "password123",
});
```

**Location:**
- `tests/setup.ts` for global test setup
- No factory or fixture files detected; data created inline

## Coverage

**Requirements:** Not explicitly enforced (no threshold config detected)

**View Coverage:**
```bash
npm run test:run -- --coverage
```

**Configuration:**
```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "json", "html"],
  include: ["src/**/*.{ts,tsx}"],
  exclude: ["src/**/*.d.ts", "src/env.js"],
}
```

## Test Types

**Unit Tests:**
- Scope: Schema validation (Zod)
- Approach: Test individual schemas with various inputs
- Location: `tests/unit/validations/auth.test.ts`
- Example: Test password validation, email validation, field length constraints
- Pattern: Use `safeParse()` and check `.success` and `.error.issues`

```typescript
const result = signUpSchema.safeParse({
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  confirmPassword: "password123",
});
expect(result.success).toBe(true);
```

**Integration Tests:**
- Not explicitly separated; would test API endpoints with database
- Approach: Use tRPC client with real context

**E2E Tests:**
- Framework: Playwright 1.57.0
- Scope: Full user workflows (auth flows, navigation, form validation)
- Location: `tests/e2e/auth.spec.ts`
- Approach: Browser automation with page interactions

## E2E Test Patterns

**Navigation Testing:**
```typescript
test("should navigate from sign-in to sign-up", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("link", { name: /sign up/i }).click();
  await expect(page).toHaveURL("/sign-up");
});
```

**Form Interaction:**
```typescript
test("should show validation errors on sign-up form", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible();
});

test("should show password mismatch error", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel(/name/i).fill("Test User");
  await page.getByLabel(/email/i).fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm Password").fill("different123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/passwords do not match/i)).toBeVisible();
});
```

**Route Protection Testing:**
```typescript
test("should redirect unauthenticated user from dashboard to sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard/);
});
```

**Visibility Assertions:**
- Playwright selectors: `getByText()`, `getByLabel()`, `getByRole()`, `getByPlaceholderText()`
- Case-insensitive matching with regex: `/pattern/i`
- Assertions: `toBeVisible()`, `toHaveURL()`

## Unit Test Patterns (Zod Validation)

**Valid Input Testing:**
```typescript
it("should accept valid input", () => {
  const result = signUpSchema.safeParse({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123",
  });
  expect(result.success).toBe(true);
});
```

**Invalid Input Testing:**
```typescript
it("should reject name less than 2 characters", () => {
  const result = signUpSchema.safeParse({
    name: "T",
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123",
  });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0]?.message).toBe(
      "Name must be at least 2 characters"
    );
  }
});
```

**Cross-Field Validation:**
```typescript
it("should reject mismatched passwords", () => {
  const result = signUpSchema.safeParse({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    confirmPassword: "different123",
  });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0]?.message).toBe("Passwords do not match");
  }
});
```

## Async Testing

- E2E tests use Playwright's async/await patterns
- All page interactions return Promises
- No special async utilities needed (Playwright handles this)

## Testing Best Practices Applied

1. **Descriptive names:** Tests clearly state what they validate
2. **Single responsibility:** Each test validates one behavior
3. **Arrange-Act-Assert:** Clear separation in test structure
4. **Test data isolation:** No shared state between tests
5. **Browser interaction:** E2E tests use realistic user flows
6. **Case-insensitive matching:** Accessible selector patterns in E2E
7. **Error message validation:** Tests check specific error messages

## Coverage Areas

**Well-tested:**
- Authentication schemas (sign-up, sign-in, password reset)
- Form validation (required fields, constraints)
- Route protection (redirect behavior)
- Navigation (link and URL changes)

**Not Yet Tested (Gaps):**
- tRPC API endpoints
- Database operations
- Authentication flows (actual sign-in logic)
- Component rendering (except E2E)
- Error handling in services

---

*Testing analysis: 2026-01-22*
