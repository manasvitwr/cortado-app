import { expect, test } from "@playwright/test";

const hasSignupCredentials = Boolean(
  process.env.E2E_SIGNUP_EMAIL &&
  process.env.E2E_SIGNUP_PASSWORD &&
  process.env.E2E_SIGNUP_EMAIL_CODE,
);

test.describe("Clerk signup session transition", () => {
  test.skip(
    !hasSignupCredentials,
    "Set E2E_SIGNUP_EMAIL, E2E_SIGNUP_PASSWORD, and E2E_SIGNUP_EMAIL_CODE for the fresh-signup smoke test.",
  );

  test("leaves signup on onboarding or home after the session completes", async ({
    page,
  }) => {
    await page.goto("/sign-up");
    await page.getByLabel(/email/i).fill(process.env.E2E_SIGNUP_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_SIGNUP_PASSWORD!);
    await page
      .getByRole("button", { name: /continue|create account|sign up/i })
      .click();

    await page
      .getByLabel(/verification code|email code|code/i)
      .fill(process.env.E2E_SIGNUP_EMAIL_CODE!);

    await expect(page).toHaveURL(/\/(onboarding|home)(?:\/)?$/);
    await expect(page.getByText(/complete your profile|hello,/i)).toBeVisible();
  });
});
