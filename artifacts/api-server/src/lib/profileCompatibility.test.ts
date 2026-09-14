import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GetProfileResponse, UpdateProfileBody } from "@workspace/api-zod";

describe("profile username compatibility", () => {
  it("accepts legacy usernames in profile responses", () => {
    const result = GetProfileResponse.shape.username.safeParse("Legacy.User-42");
    assert.equal(result.success, true);
  });

  it("keeps strict validation for username updates", () => {
    assert.equal(
      UpdateProfileBody.shape.username.safeParse("legacy-user").success,
      false,
    );
    assert.equal(
      UpdateProfileBody.shape.username.safeParse("legacy_user_42").success,
      true,
    );
  });
});