export function getTokenFromAuthUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const queryToken = parsedUrl.searchParams.get("token");
    if (queryToken) {
      return queryToken;
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    return pathParts.at(-1) ?? null;
  } catch {
    return null;
  }
}
