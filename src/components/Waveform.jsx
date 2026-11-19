import { useId, useRef } from "react";
import { usePauseOffscreen } from "../lib/ticker";

const BARS = 64;
const W = 640; // viewBox width: one bar every 10 units
const H = 100;

// A fixed, speech-like envelope: bursts and pauses from a few slow sines.
// Computed once, so the waveform is identical on every render.
const HEIGHTS = Array.from({ length: BARS }, (_, i) => {
  const burst = Math.abs(Math.sin(i * 0.23 + 0.6) * Math.sin(i * 0.071 + 1.3));
  const grain = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + Math.sin(i * 0.9)));
  return 0.12 + 0.88 * burst * grain;
});

// Every bar is one segment of a single path, so the whole waveform is one
// element (not 64), however wide the track is drawn.
const PATH = HEIGHTS.map((h, i) => {
  const x = i * (W / BARS) + W / BARS / 2;
  const half = (h * H * 0.8) / 2;
  return `M${x} ${(H / 2 - half).toFixed(1)}V${(H / 2 + half).toFixed(1)}`;
}).join("");

function Bars({ stroke }) {
  return (
    <svg
      className="wave__svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      <path
        d={PATH}
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
    </svg>
  );
}

/**
 * An audio track from the timeline: a waveform the playhead sweeps across,
 * lighting it up in the warm grade. The "played" wipe uses two opposing
 * transforms (window and contents), so nothing re-lays out or re-paints
 * per frame, and it all pauses off screen.
 */
export default function Waveform() {
  const ref = useRef(null);
  const grad = `wave-grad-${useId().replace(/:/g, "")}`;
  usePauseOffscreen(ref);
  return (
    <div className="wave" ref={ref} aria-hidden="true">
      <div className="wave__head label">
        <span className="wave__tag">A1</span>
        <span>Audio</span>
        <span className="wave__meta">Stereo · 48 kHz</span>
      </div>
      <div className="wave__track">
        <svg className="wave__defs" width="0" height="0">
          <defs>
            <linearGradient id={grad} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#ffc861" />
              <stop offset="0.5" stopColor="#ff8f4f" />
              <stop offset="1" stopColor="#ff6150" />
            </linearGradient>
          </defs>
        </svg>
        <Bars stroke="rgb(230 236 233 / 0.16)" />
        <span className="wave__lit">
          <span className="wave__lit-in">
            <Bars stroke={`url(#${grad})`} />
          </span>
        </span>
        <span className="wave__ph" />
      </div>
    </div>
  );
}
