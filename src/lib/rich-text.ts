/**
 * Minimal renderer for the Markdown subset used in product care guides,
 * guide articles and CMS pages. Deliberately not a full Markdown parser:
 * input is escaped first, so admin-authored content cannot inject HTML.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*(?!\s)(.+?)(?<!\s)\*/g, '$1<em>$2</em>');
}

export function renderRichText(source: string): string {
  const blocks = source.split(/\n{2,}/);
  const html: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    if (block.startsWith('### ')) {
      html.push(`<h3>${inline(block.slice(4))}</h3>`);
    } else if (block.startsWith('## ')) {
      html.push(`<h2>${inline(block.slice(3))}</h2>`);
    } else if (/^[-*]\s+/m.test(block) && block.split('\n').every((l) => /^[-*]\s+/.test(l.trim()))) {
      const items = block
        .split('\n')
        .map((l) => `<li>${inline(l.trim().replace(/^[-*]\s+/, ''))}</li>`)
        .join('');
      html.push(`<ul>${items}</ul>`);
    } else {
      html.push(`<p>${inline(block).replace(/\n/g, '<br/>')}</p>`);
    }
  }
  return html.join('');
}

/** Plain-text excerpt for meta descriptions and cards. */
export function excerpt(source: string, max = 160): string {
  const flat = source
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}
