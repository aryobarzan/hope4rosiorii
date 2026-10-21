import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { revalidateTag } from "next/cache";

vi.mock("next-sanity/webhook", () => ({ parseBody: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

async function callRoute() {
  const request = new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
  });
  return POST(request);
}

describe("/api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 500 when the secret is not configured", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", undefined);

    const response = await callRoute();

    expect(response.status).toBe(500);
    expect(parseBody).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 500 when the secret is an empty string", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "");

    const response = await callRoute();

    expect(response.status).toBe(500);
    expect(parseBody).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 401 when the signature is invalid", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "secret");
    vi.mocked(parseBody).mockResolvedValue({
      isValidSignature: false,
      body: { tags: ["animal"] },
    });

    const response = await callRoute();

    expect(parseBody).toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  // shape: [description, parsed body]
  it.each([
    ["an unknown tag", { tags: ["human"] }],
    ["an empty tags array", { tags: [] }],
    ["tags set to null", { tags: null }],
    ["no tags key", {}],
    ["a null body", null],
  ])("returns 400 for %s", async (_description, body) => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "secret");
    vi.mocked(parseBody).mockResolvedValue({
      isValidSignature: true,
      body,
    });

    const response = await callRoute();

    expect(parseBody).toHaveBeenCalled();
    expect(response.status).toBe(400);
    // Both 400 paths share a status, so we also assert based on the text: this
    // is the "filtered down to nothing" path, not the catch block
    expect(await response.text()).toBe("No known tags");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 400 when the parsed body is invalid and throws", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "secret");
    vi.mocked(parseBody).mockRejectedValue(new Error());

    const response = await callRoute();

    expect(parseBody).toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Bad request"); // the catch block
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it.each(["animal", "update", "siteSettings"])(
    "returns 200 for valid tag %s",
    async (tag) => {
      vi.stubEnv("SANITY_REVALIDATE_SECRET", "secret");
      vi.mocked(parseBody).mockResolvedValue({
        isValidSignature: true,
        body: { tags: [tag] },
      });
      // the following is unnecessary, as vi.fn() already returns undefined:  vi.mocked(revalidateTag).mockResolvedValue(undefined);

      const response = await callRoute();
      const json = await response.json();

      expect(parseBody).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(json).toEqual({ revalidated: [tag] });
      expect(revalidateTag).toHaveBeenCalledOnce();
      expect(revalidateTag).toHaveBeenCalledWith(tag, "max");
    },
  );

  it("returns 200 for valid tag animal and invalid tag human", async () => {
    vi.stubEnv("SANITY_REVALIDATE_SECRET", "secret");
    vi.mocked(parseBody).mockResolvedValue({
      isValidSignature: true,
      body: { tags: ["animal", "human"] },
    });

    const response = await callRoute();
    const json = await response.json();

    expect(parseBody).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(json).toEqual({ revalidated: ["animal"] });
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith("animal", "max");
    expect(revalidateTag).not.toHaveBeenCalledWith("human", "max");
  });
});
