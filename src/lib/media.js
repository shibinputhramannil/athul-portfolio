import { useEffect, useState } from "react";

/* ---------- Timecode ---------- */
const two = (n) => String(Math.floor(n)).padStart(2, "0");

/** Seconds to HH:MM:SS:FF at the given frame rate. */
export function timecode(sec = 0, fps = 24) {
  const s = Math.max(0, sec);
  return `${two(s / 3600)}:${two((s / 60) % 60)}:${two(s % 60)}:${two((s % 1) * fps)}`;
}

/** Seconds to m:ss. */
export function duration(sec) {
  if (sec == null) return null;
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${two(s % 60)}`;
}

/* ---------- Per-edit colour signature ---------- */
// Every edit gets its own accent, sampled from its poster frame: a
// saturation-weighted average, then lifted so it reads as light on black.
const toneCache = new Map();
const FALLBACK = "142 210 190";

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}

function sampleTone(img) {
  const c = document.createElement("canvas");
  c.width = 24;
  c.height = 40;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let r = 0;
  let g = 0;
  let b = 0;
  let w = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    // Favour colourful mid-tones over black bars and blown highlights.
    const weight = 0.05 + s * s * (1 - Math.abs(l - 0.5) * 1.6);
    if (weight <= 0) continue;
    r += data[i] * weight;
    g += data[i + 1] * weight;
    b += data[i + 2] * weight;
    w += weight;
  }
  if (!w) return FALLBACK;
  const [h, s] = rgbToHsl(r / w, g / w, b / w);
  const [R, G, B] = hslToRgb(h, Math.min(0.85, Math.max(0.42, s * 1.35)), 0.62);
  return `${R} ${G} ${B}`;
}

export function loadTone(src) {
  if (!src) return Promise.resolve(FALLBACK);
  if (toneCache.has(src)) return toneCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        resolve(sampleTone(img));
      } catch {
        resolve(FALLBACK); // cross-origin poster without CORS headers
      }
    };
    img.onerror = () => resolve(FALLBACK);
    img.src = src;
  });
  toneCache.set(src, p);
  return p;
}

/** Colour signature for an edit as an "r g b" string for rgb(var(--tone)). */
export function useTone(src) {
  const [tone, setTone] = useState(FALLBACK);
  useEffect(() => {
    let live = true;
    loadTone(src).then((t) => live && setTone(t));
    return () => {
      live = false;
    };
  }, [src]);
  return tone;
}

/** Tones for a whole list, keyed by id. */
export function useTones(videos) {
  const [tones, setTones] = useState({});
  useEffect(() => {
    let live = true;
    Promise.all(videos.map((v) => loadTone(v.poster))).then((list) => {
      if (!live) return;
      setTones(Object.fromEntries(videos.map((v, i) => [v.id, list[i]])));
    });
    return () => {
      live = false;
    };
  }, [videos]);
  return tones;
}
