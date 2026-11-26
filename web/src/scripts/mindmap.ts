// src/scripts/mindmap.ts
interface Box { left: number; top: number; right: number; bottom: number; cx: number; cy: number }
interface Point { x: number; y: number }
interface GraphEdge { from: string; to: string; label?: string; step?: number; style?: 'solid' | 'dashed' }

const THICK = 1.5;
const ARROW_LEN = 9;
const ARROW_HALF = 4.5;
const DETOUR = 10;
const EDGE_MARGIN = 4;

function segHitsBox(a: Point, b: Point, box: Box, pad = 4): boolean {
  return (
    Math.max(a.x, b.x) > box.left - pad &&
    Math.min(a.x, b.x) < box.right + pad &&
    Math.max(a.y, b.y) > box.top - pad &&
    Math.min(a.y, b.y) < box.bottom + pad
  );
}

function pathScore(pts: Point[], obstacles: Box[]): number {
  let hits = 0;
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    for (const box of obstacles) if (segHitsBox(pts[i], pts[i + 1], box)) hits++;
  }
  return hits * 100000 + (pts.length - 2) * 150 + len;
}

function routeOrthogonal(a: Box, b: Box, obstacles: Box[], bounds: { w: number; h: number }): Point[] {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const hMin = Math.max(a.top, b.top);
  const hMax = Math.min(a.bottom, b.bottom);
  const vMin = Math.max(a.left, b.left);
  const vMax = Math.min(a.right, b.right);
  const candidates: Point[][] = [];

  if (hMax - hMin > 8) {
    const y = (hMin + hMax) / 2;
    candidates.push([{ x: dx >= 0 ? a.right : a.left, y }, { x: dx >= 0 ? b.left : b.right, y }]);
    const topY = Math.max(EDGE_MARGIN, Math.min(a.top, b.top) - DETOUR);
    const botY = Math.min(bounds.h - EDGE_MARGIN, Math.max(a.bottom, b.bottom) + DETOUR);
    candidates.push(
      [{ x: a.cx, y: a.top }, { x: a.cx, y: topY }, { x: b.cx, y: topY }, { x: b.cx, y: b.top }],
      [{ x: a.cx, y: a.bottom }, { x: a.cx, y: botY }, { x: b.cx, y: botY }, { x: b.cx, y: b.bottom }],
    );
  } else if (vMax - vMin > 8) {
    const x = (vMin + vMax) / 2;
    candidates.push([{ x, y: dy >= 0 ? a.bottom : a.top }, { x, y: dy >= 0 ? b.top : b.bottom }]);
    const leftX = Math.max(EDGE_MARGIN, Math.min(a.left, b.left) - DETOUR);
    const rightX = Math.min(bounds.w - EDGE_MARGIN, Math.max(a.right, b.right) + DETOUR);
    candidates.push(
      [{ x: a.left, y: a.cy }, { x: leftX, y: a.cy }, { x: leftX, y: b.cy }, { x: b.left, y: b.cy }],
      [{ x: a.right, y: a.cy }, { x: rightX, y: a.cy }, { x: rightX, y: b.cy }, { x: b.right, y: b.cy }],
    );
  } else {
    const axH = dx >= 0 ? a.right : a.left;
    const bxH = dx >= 0 ? b.left : b.right;
    const ayV = dy >= 0 ? a.bottom : a.top;
    const byV = dy >= 0 ? b.top : b.bottom;
    const midX = (axH + bxH) / 2;
    const midY = (ayV + byV) / 2;
    candidates.push(
      [{ x: axH, y: a.cy }, { x: b.cx, y: a.cy }, { x: b.cx, y: byV }],
      [{ x: a.cx, y: ayV }, { x: a.cx, y: b.cy }, { x: bxH, y: b.cy }],
      [{ x: axH, y: a.cy }, { x: midX, y: a.cy }, { x: midX, y: b.cy }, { x: bxH, y: b.cy }],
      [{ x: a.cx, y: ayV }, { x: a.cx, y: midY }, { x: b.cx, y: midY }, { x: b.cx, y: byV }],
    );
  }

  return candidates.reduce((best, cand) =>
    pathScore(cand, obstacles) < pathScore(best, obstacles) ? cand : best,
  );
}

function initMindMap(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-mm-stage]');
  const grid = root.querySelector<HTMLElement>('[data-mm-grid]');
  const edgeLayer = root.querySelector<HTMLElement>('[data-mm-edges]');
  const specEl = root.querySelector<HTMLScriptElement>('[data-mm-spec]');
  if (!stage || !grid || !edgeLayer || !specEl?.textContent) return;

  const { spec, maxStep, hasSteps } = JSON.parse(specEl.textContent) as {
    spec: { edges: GraphEdge[] };
    maxStep: number;
    hasSteps: boolean;
  };

  let currentStep = maxStep; // default: full map visible for reading/printing
  const nodeEls = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-mm-node]').forEach((el) => {
    nodeEls.set(el.dataset.mmNode!, el);
  });

  const counter = root.querySelector<HTMLElement>('[data-mm-counter]');
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-mm-prev]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-mm-next]');
  const allBtn = root.querySelector<HTMLButtonElement>('[data-mm-all]');

  function render() {
    nodeEls.forEach((el) => {
      const s = Number(el.dataset.mmStep ?? 0);
      const visible = !hasSteps || s <= currentStep;
      el.style.opacity = visible ? '1' : '0.14';
      el.style.transform = visible ? 'translateY(0)' : 'translateY(4px)';
    });

    if (counter) counter.textContent = `Step ${currentStep} / ${maxStep}`;
    if (prevBtn) prevBtn.disabled = currentStep <= 0;
    if (nextBtn) nextBtn.disabled = currentStep >= maxStep;

    const bounds = { w: stage!.offsetWidth, h: stage!.offsetHeight };
    if (!bounds.w || !bounds.h) return;

    const boxes = new Map<string, Box>();
    nodeEls.forEach((el, id) => {
      const left = grid!.offsetLeft + el.offsetLeft;
      const top = grid!.offsetTop + el.offsetTop;
      const right = left + el.offsetWidth;
      const bottom = top + el.offsetHeight;
      boxes.set(id, { left, top, right, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2 });
    });

    edgeLayer!.innerHTML = '';

    for (const edge of spec.edges) {
      const a = boxes.get(edge.from);
      const b = boxes.get(edge.to);
      if (!a || !b) continue;

      const visible = !hasSteps || (edge.step ?? 0) <= currentStep;
      const obstacles = [...boxes.entries()]
        .filter(([id]) => id !== edge.from && id !== edge.to)
        .map(([, box]) => box);
      const pts = routeOrthogonal(a, b, obstacles, bounds);

      const group = document.createElement('div');
      group.style.opacity = visible ? '1' : '0.12';
      group.style.transition = 'opacity 180ms ease-out';

      let maxSeg = -1;
      let labelX = (pts[0].x + pts[pts.length - 1].x) / 2;
      let labelY = (pts[0].y + pts[pts.length - 1].y) / 2;

      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i];
        const q = pts[i + 1];
        const horizontal = Math.abs(q.y - p.y) < 0.5;
        const len = Math.hypot(q.x - p.x, q.y - p.y);
        if (len > maxSeg) {
          maxSeg = len;
          labelX = (p.x + q.x) / 2;
          labelY = (p.y + q.y) / 2;
        }
        const seg = document.createElement('div');
        const half = THICK / 2;
        seg.style.position = 'absolute';
        seg.style.left = `${horizontal ? Math.min(p.x, q.x) - half : p.x - half}px`;
        seg.style.top = `${horizontal ? p.y - half : Math.min(p.y, q.y) - half}px`;
        seg.style.width = `${horizontal ? Math.abs(q.x - p.x) + THICK : THICK}px`;
        seg.style.height = `${horizontal ? THICK : Math.abs(q.y - p.y) + THICK}px`;
        seg.style.background =
          edge.style === 'dashed'
            ? `repeating-linear-gradient(${horizontal ? 'to right' : 'to bottom'}, currentColor 0 8px, transparent 8px 13px)`
            : 'currentColor';
        group.appendChild(seg);
      }

      // Arrowhead
      const p = pts[pts.length - 2];
      const q = pts[pts.length - 1];
      const horizontal = Math.abs(q.y - p.y) < 0.5;
      const arrow = document.createElement('div');
      arrow.style.position = 'absolute';
      arrow.style.width = '0';
      arrow.style.height = '0';
      if (horizontal) {
        const right = q.x >= p.x;
        arrow.style.left = `${right ? q.x - ARROW_LEN : q.x}px`;
        arrow.style.top = `${q.y - ARROW_HALF}px`;
        arrow.style.borderTop = `${ARROW_HALF}px solid transparent`;
        arrow.style.borderBottom = `${ARROW_HALF}px solid transparent`;
        arrow.style[right ? 'borderLeft' : 'borderRight'] = `${ARROW_LEN}px solid currentColor`;
      } else {
        const down = q.y >= p.y;
        arrow.style.left = `${q.x - ARROW_HALF}px`;
        arrow.style.top = `${down ? q.y - ARROW_LEN : q.y}px`;
        arrow.style.borderLeft = `${ARROW_HALF}px solid transparent`;
        arrow.style.borderRight = `${ARROW_HALF}px solid transparent`;
        arrow.style[down ? 'borderTop' : 'borderBottom'] = `${ARROW_LEN}px solid currentColor`;
      }
      group.appendChild(arrow);

      if (edge.label) {
        const lbl = document.createElement('div');
        lbl.textContent = edge.label;
        lbl.className =
          'absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-paper px-1.5 py-0.5 font-code text-label uppercase text-muted';
        lbl.style.left = `${labelX}px`;
        lbl.style.top = `${labelY}px`;
        group.appendChild(lbl);
      }

      edgeLayer!.appendChild(group);
    }
  }

  prevBtn?.addEventListener('click', () => {
    currentStep = Math.max(0, currentStep - 1);
    render();
  });
  nextBtn?.addEventListener('click', () => {
    currentStep = Math.min(maxStep, currentStep + 1);
    render();
  });
  allBtn?.addEventListener('click', () => {
    currentStep = currentStep === maxStep ? 0 : maxStep;
    render();
  });
  root.addEventListener('keydown', (e) => {
    if (!hasSteps) return;
    if (e.key === 'ArrowRight') {
      currentStep = Math.min(maxStep, currentStep + 1);
      render();
    } else if (e.key === 'ArrowLeft') {
      currentStep = Math.max(0, currentStep - 1);
      render();
    }
  });

  const ro = new ResizeObserver(render);
  ro.observe(stage);
  render();
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLElement>('[data-mindmap]').forEach(initMindMap);
});
