import { expect, test } from "@playwright/test";

const profile = {
  id: "user_profile_smoke",
  // This deliberately uses a legacy format that is no longer accepted for new
  // username edits. Reads and unrelated profile saves must preserve it.
  username: "Legacy.User",
  displayName: "Legacy Learner",
  realName: "Legacy Learner",
  bio: "Existing bio",
  interests: ["Design"],
  onboardingCompleted: true,
  avatarUrl: null,
  bannerUrl: null,
  topEntryIds: [],
  createdAt: "2026-09-14T00:00:00.000Z",
  topEntries: [],
  stats: { videosSaved: 0, videosWatched: 0, playlistsCreated: 0 },
  recentEntries: [],
  libraryEntries: [],
  publicPlaylists: [],
};

function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function requireAuthenticatedSmokeState() {
  test.skip(
    !process.env.E2E_STORAGE_STATE,
    "Set E2E_STORAGE_STATE to a Clerk-authenticated Playwright storage state.",
  );
}

test.describe("authenticated profile recovery", () => {
  test.beforeEach(() => {
    requireAuthenticatedSmokeState();
  });

  test("recovers from a transient profile request failure", async ({
    page,
  }) => {
    let profileRequests = 0;

    await page.route("**/api/profile", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      profileRequests += 1;
      if (profileRequests === 1) {
        await route.fulfill(jsonResponse({ error: "temporary failure" }, 503));
      } else {
        await route.fulfill(jsonResponse(profile));
      }
    });

    await page.goto("/home");
    await expect(
      page.getByRole("heading", { name: "We couldn’t load your profile" }),
    ).toBeVisible();
    await expect(
      page.getByText("Please retry. Your saved library hasn’t been changed."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText("Hello, Legacy Learner")).toBeVisible();
    expect(profileRequests).toBe(2);
  });

  test("completes onboarding before navigating home", async ({ page }) => {
    const incompleteProfile = { ...profile, onboardingCompleted: false };
    let savedProfile: typeof profile = incompleteProfile;
    let patchBody: Record<string, unknown> | undefined;

    await page.route("**/api/profile", async (route) => {
      if (route.request().method() === "PATCH") {
        patchBody = route.request().postDataJSON() as Record<string, unknown>;
        savedProfile = {
          ...incompleteProfile,
          ...patchBody,
          onboardingCompleted: true,
        };
        await route.fulfill(jsonResponse(savedProfile));
        return;
      }

      await route.fulfill(jsonResponse(savedProfile));
    });

    await page.goto("/home");
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByRole("button", { name: "Skip" }).click();

    await expect(page).toHaveURL(/\/home$/);
    expect(patchBody).toEqual({ onboardingCompleted: true });
    await expect(page.getByText("Hello, Legacy Learner")).toBeVisible();
  });

  test("loads and saves unrelated fields without rewriting a legacy username", async ({
    page,
  }) => {
    let patchBody: Record<string, unknown> | undefined;

    await page.route("**/api/profile", async (route) => {
      if (route.request().method() === "PATCH") {
        patchBody = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill(
          jsonResponse({
            ...profile,
            bio: patchBody.bio ?? profile.bio,
            realName: patchBody.realName ?? profile.realName,
            displayName: patchBody.displayName ?? profile.displayName,
            interests: patchBody.interests ?? profile.interests,
          }),
        );
        return;
      }

      await route.fulfill(jsonResponse(profile));
    });

    await page.goto("/profile");
    await expect(page.getByText("@Legacy.User")).toBeVisible();
    await page.getByRole("button", { name: "Edit Profile" }).click();

    await page.getByLabel("Bio").fill("Updated without touching the username");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("Updated without touching the username"),
    ).toBeVisible();
    expect(patchBody).toEqual(
      expect.objectContaining({
        bio: "Updated without touching the username",
        displayName: "Legacy Learner",
        realName: "Legacy Learner",
        interests: ["Design"],
      }),
    );
    expect(patchBody).not.toHaveProperty("username");
  });
});
