/** Tracks font families already injected so we never add duplicate <link> tags. */
const loadedFonts = new Set<string>();

/**
 * Dynamically injects a Google Fonts stylesheet for a single font family.
 * Safe to call multiple times — subsequent calls for the same family are no-ops.
 *
 * @param googleName  The exact Google Fonts family name, e.g. "Playfair Display"
 */
export function loadGoogleFont(googleName: string): void {
  const name = googleName.trim();
  if (!name || loadedFonts.has(name)) return;
  loadedFonts.add(name);

  const encoded = name.replace(/ /g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,700;1,400&display=swap`;
  document.head.appendChild(link);
}

/**
 * Injects a single Google Fonts stylesheet that loads multiple families at once
 * (one HTTP request instead of N). Already-loaded families are skipped.
 *
 * @param googleNames  Array of exact Google Fonts family names
 */
export function loadGoogleFontBatch(googleNames: string[]): void {
  const unloaded = googleNames
    .map((n) => n.trim())
    .filter((n) => n && !loadedFonts.has(n));

  if (unloaded.length === 0) return;
  unloaded.forEach((n) => loadedFonts.add(n));

  const families = unloaded
    .map((n) => `family=${n.replace(/ /g, '+')}:ital,wght@0,400;0,700;1,400`)
    .join('&');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
}
