// CMS editors paste links, so never put one into an href unchecked: a
// `javascript:` URL would run script when clicked. Only http(s) passes.
export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
