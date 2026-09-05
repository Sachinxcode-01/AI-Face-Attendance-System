import { safeRedirect } from "./api";

describe("Next.js Utility Security Tests", () => {
  test("safeRedirect allows valid internal relative paths", () => {
    expect(safeRedirect("/dashboard")).toBe("/dashboard");
    expect(safeRedirect("/profile?user=1")).toBe("/profile?user=1");
  });

  test("safeRedirect blocks protocol relative and external open redirects", () => {
    expect(safeRedirect("//evil.com")).toBe("/login");
    expect(safeRedirect("/\\evil.com")).toBe("/login");
    expect(safeRedirect("https://google.com")).toBe("/login");
    expect(safeRedirect("javascript:alert(1)")).toBe("/login");
  });
});
