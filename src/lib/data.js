import { useEffect, useState } from "react";
import staticProfile from "../content/profile.json";
import staticVideos from "virtual:videos";

/**
 * Content source. By default the site is fully static: the profile JSON and
 * the build-time list of public edits. When built with VITE_API_URL set, it
 * also asks the Django REST backend (see backend/README.md) and swaps in
 * that content if the API answers; any failure keeps the static content.
 */
export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const pad = (n) => String(n).padStart(2, "0");

function normaliseVideo(v, i) {
  return {
    id: String(v.id),
    number: v.number ? pad(v.number) : pad(i + 1),
    title: v.title || null,
    client: v.client || null,
    kind: v.kind || null,
    role: v.role || null,
    year: v.year || null,
    durationSec: typeof v.durationSec === "number" ? v.durationSec : null,
    poster: v.poster || null,
    preview: v.preview || v.full || null,
    full: v.full || v.preview || null,
  };
}

async function getJson(path, signal) {
  const res = await fetch(`${API_URL}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

export function usePortfolioData() {
  const [state, setState] = useState({
    profile: staticProfile,
    videos: staticVideos,
    source: "static",
  });

  useEffect(() => {
    if (!API_URL) return;
    const ctrl = new AbortController();
    Promise.all([
      getJson("/api/profile/", ctrl.signal),
      getJson("/api/videos/", ctrl.signal),
    ])
      .then(([profile, videos]) => {
        if (!profile?.name || !Array.isArray(videos)) return;
        setState({
          profile: { ...staticProfile, ...profile },
          videos: videos.map(normaliseVideo).filter((v) => v.poster && v.full),
          source: "api",
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError")
          console.warn(
            "Portfolio API unavailable, using bundled content.",
            err,
          );
      });
    return () => ctrl.abort();
  }, []);

  return state;
}

/** Sends the contact form to the API. Returns { ok, errors }. */
export async function sendContact(payload) {
  const res = await fetch(`${API_URL}/api/contact/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true };
  let errors = {};
  try {
    errors = await res.json();
  } catch {
    /* no body */
  }
  if (res.status === 429)
    errors = { detail: "Too many messages for now. Please email instead." };
  return { ok: false, errors };
}

/**
 * Static hosting: posts the form to Netlify Forms (registered by the hidden
 * form in index.html), which stores it and emails the owner. Resolves true
 * only when the host accepted it; other hosts answer a POST with 404/405,
 * and the caller then falls back to the visitor's email app.
 */
export async function sendHostedForm(payload) {
  const res = await fetch(import.meta.env.BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ "form-name": "contact", ...payload }),
  });
  return res.ok;
}

export const labelOf = (v) => v.title ?? `Edit ${v.number}`;
