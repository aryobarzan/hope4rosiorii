import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { client } from "@/lib/sanity/client";
import { animalExists } from "./animal-slugs";

vi.mock("@/lib/sanity/client", () => ({ client: { fetch: vi.fn() } }));

// The remembered answers live in module memory and are shared by all tests, so
// every test uses its own slug.
let n = 0;
const newSlug = () => `slug-${n++}`;
// The client's fetch has many overloads; the test only needs this one shape
const sanity = client.fetch as unknown as Mock<
  (query: string, params: { slug: string }) => Promise<boolean>
>;

describe("animalExists", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sanity.mockResolvedValue(true);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("asks Sanity for the slug it was given", async () => {
    const slug = newSlug();

    await animalExists(slug);

    expect(sanity).toHaveBeenCalledOnce();
    expect(sanity).toHaveBeenCalledWith(expect.stringContaining("$slug"), {
      slug,
    });
  });

  it("returns what Sanity says", async () => {
    sanity.mockResolvedValueOnce(true);
    expect(await animalExists(newSlug())).toBe(true);

    sanity.mockResolvedValueOnce(false);
    expect(await animalExists(newSlug())).toBe(false);
  });

  describe("an animal that exists", () => {
    it("is answered from memory the second time", async () => {
      const slug = newSlug();

      await animalExists(slug);
      expect(await animalExists(slug)).toBe(true);

      expect(sanity).toHaveBeenCalledOnce();
    });

    it("is checked again after ten minutes", async () => {
      const slug = newSlug();
      await animalExists(slug);

      vi.advanceTimersByTime(10 * 60_000 - 1);
      await animalExists(slug);
      expect(sanity).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      await animalExists(slug);
      expect(sanity).toHaveBeenCalledTimes(2);
    });
  });

  describe("an animal that does not exist", () => {
    beforeEach(() => sanity.mockResolvedValue(false));

    it("is answered from memory for a short while, so repeats are cheap", async () => {
      const slug = newSlug();

      await animalExists(slug);
      expect(await animalExists(slug)).toBe(false);

      expect(sanity).toHaveBeenCalledOnce();
    });

    it("is checked again after 30 seconds, so a new animal shows up", async () => {
      const slug = newSlug();
      await animalExists(slug);

      vi.advanceTimersByTime(30_000);
      sanity.mockResolvedValue(true); // published in the meantime

      expect(await animalExists(slug)).toBe(true);
      expect(sanity).toHaveBeenCalledTimes(2);
    });
  });

  it("lets the page decide when Sanity cannot be reached", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    sanity.mockRejectedValue(new Error("network down"));

    // An outage must never turn into 404s for animals that do exist
    expect(await animalExists(newSlug())).toBe(true);
    expect(consoleError).toHaveBeenCalled();
  });

  it("does not remember a failed lookup", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const slug = newSlug();
    sanity.mockRejectedValueOnce(new Error("network down"));
    await animalExists(slug);

    sanity.mockResolvedValueOnce(false);
    expect(await animalExists(slug)).toBe(false);
    expect(sanity).toHaveBeenCalledTimes(2);
  });
});
