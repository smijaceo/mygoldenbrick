import { describe, expect, it } from "vitest";
import { redirect } from "next/navigation";
import { submitAction } from "./submit";

describe("submitAction", () => {
  it("reports ok when the action finishes", async () => {
    expect(await submitAction(async () => {}, new FormData())).toBe("ok");
  });

  it("reports failed instead of throwing when the action fails, so the form keeps its text", async () => {
    expect(await submitAction(async () => { throw new Error("offline"); }, new FormData())).toBe("failed");
  });

  it("lets Next's redirect through (an expired session goes to login, not to an error message)", async () => {
    let redirectError: unknown;
    try { redirect("/login"); } catch (e) { redirectError = e; }
    await expect(submitAction(async () => { throw redirectError; }, new FormData())).rejects.toBe(redirectError);
  });
});
