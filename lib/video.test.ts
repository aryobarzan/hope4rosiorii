import { describe, expect, it } from "vitest";
import { videoHost, videoLabel, youtubeVideoId } from "./video";

describe("videoHost", () => {
  it("recognises YouTube in its usual forms", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=abc123",
      "https://youtube.com/shorts/abc123",
      "https://m.youtube.com/watch?v=abc123",
      "https://youtu.be/abc123",
      "https://www.youtube-nocookie.com/embed/abc123",
    ]) {
      expect(videoHost(url)).toBe("youtube");
    }
  });

  it("recognises Instagram and Facebook", () => {
    expect(videoHost("https://www.instagram.com/reel/xyz/")).toBe("instagram");
    expect(videoHost("https://instagr.am/p/xyz")).toBe("instagram");
    expect(videoHost("https://www.facebook.com/watch/?v=1")).toBe("facebook");
    expect(videoHost("https://m.facebook.com/reel/1")).toBe("facebook");
    expect(videoHost("https://fb.watch/abc")).toBe("facebook");
  });

  it("ignores case and surrounding spaces", () => {
    expect(videoHost("  HTTPS://WWW.YouTube.COM/watch?v=1 ")).toBe("youtube");
  });

  it("calls any other web address 'other'", () => {
    expect(videoHost("https://vimeo.com/123")).toBe("other");
  });

  it("is not fooled by look-alike domains", () => {
    expect(videoHost("https://notyoutube.com/watch?v=1")).toBe("other");
    expect(videoHost("https://youtube.com.evil.example/watch")).toBe("other");
    expect(videoHost("https://evil.example/?u=youtube.com")).toBe("other");
    expect(videoHost("https://user@evil.example/youtube.com")).toBe("other");
  });

  it("gives null for anything that is not a web address", () => {
    expect(videoHost("")).toBeNull();
    expect(videoHost("not a url")).toBeNull();
    expect(videoHost("youtube.com/watch?v=1")).toBeNull(); // no scheme
    expect(videoHost("javascript:alert(1)")).toBeNull();
    expect(videoHost("ftp://youtube.com/video")).toBeNull();
  });
});

describe("videoLabel", () => {
  it("uses the brand name for known sites", () => {
    expect(videoLabel("https://youtu.be/abc123")).toBe("YouTube");
    expect(videoLabel("https://www.instagram.com/reel/xyz/")).toBe("Instagram");
    expect(videoLabel("https://fb.watch/abc")).toBe("Facebook");
  });

  it("uses the site's own name for other links, without 'www.'", () => {
    expect(videoLabel("https://www.vimeo.com/123")).toBe("vimeo.com");
    expect(videoLabel("https://Player.Example.org/v/1")).toBe("player.example.org");
  });

  it("gives null when the link is not a web address", () => {
    expect(videoLabel("javascript:alert(1)")).toBeNull();
    expect(videoLabel("nonsense")).toBeNull();
  });
});

describe("youtubeVideoId", () => {
  const id = "dQw4w9WgXcQ";

  it("finds the ID in every link form", () => {
    for (const url of [
      `https://www.youtube.com/watch?v=${id}`,
      `https://www.youtube.com/watch?feature=share&v=${id}&t=10s`,
      `https://m.youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}`,
      `https://youtu.be/${id}?si=abc`,
      `https://www.youtube.com/shorts/${id}`,
      `https://www.youtube.com/embed/${id}`,
      `https://www.youtube.com/live/${id}`,
      `https://www.youtube-nocookie.com/embed/${id}`,
    ]) {
      expect(youtubeVideoId(url)).toBe(id);
    }
  });

  it("gives null for YouTube links that are not one video", () => {
    expect(youtubeVideoId("https://www.youtube.com/@hope4rosiorii")).toBeNull();
    expect(youtubeVideoId("https://www.youtube.com/playlist?list=PL123")).toBeNull();
    expect(youtubeVideoId("https://www.youtube.com/watch")).toBeNull();
  });

  it("gives null for a malformed ID, so nothing odd reaches the embed address", () => {
    expect(youtubeVideoId("https://youtu.be/short")).toBeNull();
    expect(youtubeVideoId(`https://www.youtube.com/watch?v=${id}%22onload=x`)).toBeNull();
    expect(youtubeVideoId("https://www.youtube.com/watch?v=../../etc/passwd")).toBeNull();
  });

  it("gives null for other sites", () => {
    expect(youtubeVideoId(`https://vimeo.com/${id}`)).toBeNull();
    expect(youtubeVideoId(`https://notyoutube.com/watch?v=${id}`)).toBeNull();
    expect(youtubeVideoId("nonsense")).toBeNull();
  });
});
