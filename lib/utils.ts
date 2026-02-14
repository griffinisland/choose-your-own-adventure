/**
 * Strip HTML tags for plain-text display (e.g. alt text, dropdown options).
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}
