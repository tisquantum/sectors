/** In-game play URLs (used for mobile scroll/layout behavior). */
export function isGamePlayPathname(pathname: string | null): boolean {
  if (!pathname) return false;
  if (/^\/games\/executives\/[^/]+$/.test(pathname)) return true;
  if (!/^\/games\/[^/]+$/.test(pathname)) return false;
  const slug = pathname.slice("/games/".length);
  if (slug === "executives") return false;
  return true;
}
