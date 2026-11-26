// src/scripts/math.ts
declare global {
  interface Window {
    katex?: {
      render(tex: string, el: HTMLElement, opts?: Record<string, unknown>): void;
      renderToString(tex: string, opts?: Record<string, unknown>): string;
    };
  }
}

export function renderRichMath(input: string): string {
  const escapeHtml = (t: string) =>
    t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return input
    .split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g)
    .map((tok) => {
      if (window.katex && tok.startsWith('$$') && tok.endsWith('$$') && tok.length > 4) {
        return window.katex.renderToString(tok.slice(2, -2), { displayMode: true, throwOnError: false });
      }
      if (window.katex && tok.startsWith('$') && tok.endsWith('$') && tok.length > 2) {
        return window.katex.renderToString(tok.slice(1, -1), { displayMode: false, throwOnError: false });
      }
      return escapeHtml(tok).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    })
    .join('');
}

export function hydrateMath() {
  if (!window.katex) return;
  document.querySelectorAll<HTMLElement>('[data-katex]').forEach((el) => {
    const tex = el.dataset.tex ?? el.textContent ?? '';
    const displayMode = el.dataset.katex === 'display';
    window.katex!.render(tex, el, { displayMode, throwOnError: false });
  });
  document.querySelectorAll<HTMLElement>('[data-mm-rich]').forEach((el) => {
    el.innerHTML = renderRichMath(el.dataset.mmRich ?? '');
  });
}

function hydrateCodeCopy() {
  document.querySelectorAll<HTMLElement>('[data-code-block]').forEach((block) => {
    const btn = block.querySelector<HTMLButtonElement>('[data-copy-code]');
    const src = block.querySelector<HTMLElement>('[data-code-source]');
    if (!btn || !src) return;
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(src.textContent ?? '');
      const prev = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = prev), 1400);
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  hydrateMath();
  hydrateCodeCopy();
});
window.addEventListener('load', hydrateMath);
