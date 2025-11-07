export function preprocessText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\r?\n|\r/g, ' ')
    .replace(/[^\w\s.,;:()'-]/g, '')
    .trim();
}
