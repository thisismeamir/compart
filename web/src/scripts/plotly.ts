// src/scripts/plotly.ts
declare global {
  interface Window {
    Plotly?: {
      newPlot(
        el: HTMLElement,
        data: unknown[],
        layout?: Record<string, unknown>,
        config?: Record<string, unknown>,
      ): Promise<void>;
      Plots: { resize(el: HTMLElement): void };
    };
  }
}

let plotlyPromise: Promise<NonNullable<Window["Plotly"]>> | null = null;

function loadPlotly() {
  if (window.Plotly) return Promise.resolve(window.Plotly);
  if (!plotlyPromise) {
    plotlyPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.plot.ly/plotly-2.35.2.min.js";
      s.async = true;
      s.onload = () =>
        window.Plotly
          ? resolve(window.Plotly)
          : reject(new Error("Plotly failed"));
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return plotlyPromise;
}

function surfaceTheme(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const paper = cs.getPropertyValue("--paper").trim() || "#ffffff";
  const ink = cs.getPropertyValue("--ink").trim() || "#181818";
  const muted = cs.getPropertyValue("--muted").trim() || "#8D8D8D";
  const rule = cs.getPropertyValue("--rule").trim() || "#E0E0E0";
  const accent = cs.getPropertyValue("--accent").trim() || "#7017ff";

  return {
    paper_bgcolor: paper,
    plot_bgcolor: paper,
    font: { family: "IBM Plex Sans, sans-serif", color: ink, size: 13 },
    colorway: [accent, "#0072C3", "#009D9A", "#EB6200", "#198038", "#D02670"],
    margin: { t: 36, r: 24, b: 48, l: 56 },
    xaxis: {
      gridcolor: rule,
      zerolinecolor: rule,
      linecolor: rule,
      tickfont: { color: muted },
    },
    yaxis: {
      gridcolor: rule,
      zerolinecolor: rule,
      linecolor: rule,
      tickfont: { color: muted },
    },
  };
}

function mountPlot(block: HTMLElement) {
  if (block.dataset.plotlyMounted) return;
  block.dataset.plotlyMounted = "true";

  const canvas = block.querySelector<HTMLElement>("[data-plotly-canvas]");
  const specEl = block.querySelector<HTMLScriptElement>("[data-plotly-spec]");
  if (!canvas || !specEl?.textContent) return;

  const { data, layout = {}, config = {} } = JSON.parse(specEl.textContent);
  const base = surfaceTheme(block);

  loadPlotly().then((Plotly) => {
    canvas.innerHTML = "";
    const mergedLayout = {
      ...base,
      ...layout,
      xaxis: { ...base.xaxis, ...(layout.xaxis ?? {}) },
      yaxis: { ...base.yaxis, ...(layout.yaxis ?? {}) },
    };
    Plotly.newPlot(canvas, data, mergedLayout, {
      responsive: true,
      displaylogo: false,
      ...config,
    });
    window.addEventListener("compart:theme-change", () => {
      const t = surfaceTheme(block);
      (Plotly as any).relayout(canvas, {
        paper_bgcolor: t.paper_bgcolor,
        plot_bgcolor: t.plot_bgcolor,
        "font.color": t.font.color,
        "xaxis.gridcolor": t.xaxis.gridcolor,
        "xaxis.linecolor": t.xaxis.linecolor,
        "xaxis.tickfont.color": t.xaxis.tickfont.color,
        "yaxis.gridcolor": t.yaxis.gridcolor,
        "yaxis.linecolor": t.yaxis.linecolor,
        "yaxis.tickfont.color": t.yaxis.tickfont.color,
      });
    });
    const ro = new ResizeObserver(() => Plotly.Plots.resize(canvas));
    ro.observe(canvas);
  });
}

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      mountPlot(e.target as HTMLElement);
      io.unobserve(e.target);
    }
  },
  { rootMargin: "200px 0px" },
);

document
  .querySelectorAll<HTMLElement>("[data-plotly-block]")
  .forEach((b) => io.observe(b));
