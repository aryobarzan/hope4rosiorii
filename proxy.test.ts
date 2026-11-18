import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import proxy from "./proxy";

// proxy.ts makes one slug check per kind of page. Both are replaced by mocks
// the tests can control; vi.hoisted makes them exist before vi.mock runs.
const { animalExists, eventExists, postExists } = vi.hoisted(() => ({
  animalExists: vi.fn(),
  eventExists: vi.fn(),
  postExists: vi.fn(),
}));
vi.mock("@/lib/slug-exists", () => ({
  createSlugCheck: (type: string) =>
    type === "animal"
      ? animalExists
      : type === "event"
        ? eventExists
        : postExists,
}));

// next-intl's own routing is not what is tested here, only what proxy.ts does
// before it. The stand-in just passes the request on, like NextResponse.next().
vi.mock("next-intl/middleware", async () => {
  const { NextResponse } = await import("next/server");
  return { default: () => () => NextResponse.next() };
});

const request = (path: string) => new NextRequest(`http://localhost${path}`);

// NextResponse.rewrite() puts its target in this header
const rewrittenTo = (response: Response) =>
  response.headers.get("x-middleware-rewrite");

// NextResponse.next() marks "carry on to the page" with this header
const passedOn = (response: Response) =>
  response.headers.get("x-middleware-next") === "1";

describe("proxy: animal pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animalExists).mockResolvedValue(true);
  });

  it("lets an animal that exists through to the page", async () => {
    const response = await proxy(request("/en/animals/elli"));

    expect(animalExists).toHaveBeenCalledWith("elli");
    expect(passedOn(response)).toBe(true);
    expect(rewrittenTo(response)).toBeNull();
  });

  it("rewrites an unknown animal to an address that answers 404", async () => {
    vi.mocked(animalExists).mockResolvedValue(false);

    const response = await proxy(request("/fr/animals/no-such-animal"));

    expect(rewrittenTo(response)).toBe(
      "http://localhost/fr/animal-not-found",
    );
  });

  it("keeps the visitor's language in the rewrite", async () => {
    vi.mocked(animalExists).mockResolvedValue(false);

    for (const locale of ["lb", "en", "fr", "de"]) {
      const response = await proxy(request(`/${locale}/animals/nope`));
      expect(rewrittenTo(response)).toContain(`/${locale}/animal-not-found`);
    }
  });

  it("treats a trailing slash like no trailing slash", async () => {
    vi.mocked(animalExists).mockResolvedValue(false);

    const response = await proxy(request("/en/animals/nope/"));

    expect(animalExists).toHaveBeenCalledWith("nope");
    expect(rewrittenTo(response)).toContain("animal-not-found");
  });

  it("looks the slug up as plain text, not percent-encoded", async () => {
    await proxy(request("/en/animals/caf%C3%A9"));

    expect(animalExists).toHaveBeenCalledWith("café");
  });

  it("answers an address that cannot be decoded with a 404, without a lookup", async () => {
    const response = await proxy(request("/en/animals/%E0%A4%A"));

    expect(animalExists).not.toHaveBeenCalled();
    expect(rewrittenTo(response)).toContain("animal-not-found");
  });

  it("answers an absurdly long slug with a 404, without a lookup", async () => {
    const response = await proxy(request(`/en/animals/${"a".repeat(201)}`));

    expect(animalExists).not.toHaveBeenCalled();
    expect(rewrittenTo(response)).toContain("animal-not-found");
  });

  it.each([
    "/en",
    "/en/animals",
    "/en/about",
    "/en/animals/elli/extra",
    "/en/adopt",
  ])("does not look anything up for %s", async (path) => {
    await proxy(request(path));

    expect(animalExists).not.toHaveBeenCalled();
  });

  it("does not look anything up under a language that does not exist", async () => {
    const response = await proxy(request("/gn/animals/elli"));

    expect(animalExists).not.toHaveBeenCalled();
    // The existing rule: unknown language codes fall back to the default
    expect(response.headers.get("location")).toBe(
      "http://localhost/lb/animals/elli",
    );
  });
});

describe("proxy: event pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventExists).mockResolvedValue(true);
  });

  it("lets a known event through, asking the event lookup only", async () => {
    const response = await proxy(request("/en/events/halloween"));

    expect(eventExists).toHaveBeenCalledWith("halloween");
    expect(animalExists).not.toHaveBeenCalled();
    expect(passedOn(response)).toBe(true);
  });

  it("rewrites an unknown event to the 404 address", async () => {
    vi.mocked(eventExists).mockResolvedValue(false);

    const response = await proxy(request("/fr/events/nope"));

    expect(rewrittenTo(response)).toBe("http://localhost/fr/animal-not-found");
  });

  it("answers an undecodable event address with a 404, without a lookup", async () => {
    const response = await proxy(request("/en/events/%E0%A4%A"));

    expect(eventExists).not.toHaveBeenCalled();
    expect(rewrittenTo(response)).toContain("animal-not-found");
  });

  it("does not look anything up for the events list", async () => {
    await proxy(request("/en/events"));

    expect(eventExists).not.toHaveBeenCalled();
  });
});

describe("proxy: news pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(postExists).mockResolvedValue(true);
  });

  it("lets a known post through, asking the post lookup only", async () => {
    const response = await proxy(request("/en/news/new-arrivals"));

    expect(postExists).toHaveBeenCalledWith("new-arrivals");
    expect(animalExists).not.toHaveBeenCalled();
    expect(eventExists).not.toHaveBeenCalled();
    expect(passedOn(response)).toBe(true);
  });

  it("rewrites an unknown post to the 404 address", async () => {
    vi.mocked(postExists).mockResolvedValue(false);

    const response = await proxy(request("/de/news/nope"));

    expect(rewrittenTo(response)).toBe("http://localhost/de/animal-not-found");
  });

  it("does not look anything up for the news list", async () => {
    await proxy(request("/en/news"));

    expect(postExists).not.toHaveBeenCalled();
  });
});
