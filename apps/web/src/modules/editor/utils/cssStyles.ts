/**
 * Strips `_`-prefixed metadata keys from an element's styles object before
 * spreading it onto a DOM node's `style` prop.
 *
 * Keys like `_locked`, `_hidden`, `_groupId`, `_name` are stored inside
 * `element.styles` so they round-trip through the API without a schema change.
 * They must be removed before reaching the DOM to avoid React unknown-property
 * warnings and invalid CSS.
 */
export function cssStyles(styles: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in styles) {
    if (!key.startsWith('_')) result[key] = styles[key];
  }
  return result;
}
