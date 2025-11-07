export function preprocessText(text = '') {
  if (!text) return '';
  return text
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,;:()'-]/g, '')
    .trim();
}
