import "../../styles/parts/scenes/premiere.css";
import { G, Lin } from "../ToolAI";

/**
 * Premiere Pro, topics 2–5. Each is one 10 s scene on the shared loop
 * (title 0–12%, find 13.8–29.6%, process 29.6–49%, result 49–94.7%), drawn
 * in SVG and moved in CSS (styles/parts/scenes/premiere.css). Base styles
 * are the finished result, shown as a still under reduced motion.
 */

// Deterministic noise, so the drawings never change between renders.
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
const f1 = (n) => Math.round(n * 10) / 10;

function Frame() {
  return (
    <rect className="ai-frame" x="16" y="16" width="324" height="182" rx="6" />
  );
}
function Shot({ id }) {
  return (
    <clipPath id={id}>
      <rect x="16" y="16" width="324" height="182" rx="6" />
    </clipPath>
  );
}
function Panel({ title }) {
  return (
    <>
      <rect
        className="ai-phone"
        x="352"
        y="16"
        width="114"
        height="182"
        rx="9"
      />
      <text className="ai-tag" x="362" y="32">
        {title}
      </text>
      <path className="pr-rule" d="M360 38.5H458" />
    </>
  );
}
/** Bars centred on cy, as one path. */
function barsPath(xs, heights, cy, w) {
  return xs
    .map((x, i) => {
      const h = Math.max(1.5, heights[i]);
      return `M${f1(x)} ${f1(cy - h / 2)}h${w}v${f1(h)}h-${w}z`;
    })
    .join("");
}
function Cursor({ className }) {
  return (
    <path
      className={className}
      d="M0 0 L0 12 L3.2 9 L5.6 14 L7.6 13 L5.3 8.2 L9.6 8.2 Z"
      fill="#fff"
      stroke="#08110f"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
  );
}

/* =====================================================================
   Scene Edit Detection: a flattened export plays; the AI graphs how much
   each frame differs from the last, and every spike over the threshold is
   a cut. Then an edit point lands on each and the clips separate.
   ===================================================================== */

// Cuts on the graph (x 28–328); the playhead reaches them at 19.8, 27.1,
// 34.4 and 41% of the loop.
const PR2_CUTS = [82, 148, 214, 274];
const PR2_PEAKS = [141, 138, 143, 140];
const PR2_EDGES = [28, ...PR2_CUTS, 328];
const PR2_COLORS = ["#4fd8e8", "#6f5fb0", "#3f9a9c", "#ff8f4f", "#4fd8e8"];

const PR2_GRAPH = (() => {
  const r = seeded(7);
  const pts = [];
  for (let x = 28; x <= 328; x += 4) {
    if (PR2_CUTS.some((c) => Math.abs(c - x) < 4)) continue;
    pts.push([x, 174 + r() * 7]);
  }
  PR2_CUTS.forEach((c, i) => {
    pts.push([c - 2.5, 177], [c, PR2_PEAKS[i]], [c + 2.5, 176]);
  });
  pts.sort((a, b) => a[0] - b[0]);
  return "M" + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(" L");
})();

// Where each shot sits on the contact sheet: tx, ty from the full frame.
const PR2_TILES = [
  [0, 0],
  [162, 0],
  [0, 53],
  [162, 53],
];

function Pr2Beach() {
  return (
    <>
      <rect x="16" y="16" width="324" height="106" fill="url(#pr2-beach)" />
      <circle cx="268" cy="44" r="13" fill="#fff1c4" />
      <path d="M16 84 Q100 78 178 84 T340 82 V122 H16Z" fill="#3f9a9c" />
      <path
        d="M40 92 h26 M120 96 h30 M220 92 h24 M290 97 h22"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M16 104 Q120 96 220 104 T340 101 V122 H16Z" fill="#ffd88a" />
      <path d="M70 104 a17 10 0 0 1 34 0Z" fill="#ff7a59" />
      <path d="M87 104 V118" stroke="#fff" strokeWidth="1.4" />
    </>
  );
}
function Pr2City() {
  return (
    <>
      <rect x="16" y="16" width="324" height="106" fill="url(#pr2-night)" />
      <circle cx="78" cy="40" r="9" fill="#fff1c4" opacity="0.9" />
      <path
        d="M16 122V76h34v-18h26v30h22V64h30v58zM150 122V54h36v28h24V70h28v52zM236 122V60h30v-14h22v40h22V72h30v50z"
        fill="#0d1b30"
      />
      <path
        d="M24 86h4v4h-4zM36 96h4v4h-4zM60 72h4v4h-4zM112 76h4v4h-4zM120 92h4v4h-4zM160 64h4v4h-4zM172 80h4v4h-4zM196 92h4v4h-4zM248 70h4v4h-4zM272 56h4v4h-4zM300 84h4v4h-4zM320 96h4v4h-4z"
        fill="#ffd88a"
        opacity="0.85"
      />
    </>
  );
}
function Pr2Forest() {
  return (
    <>
      <rect x="16" y="16" width="324" height="106" fill="url(#pr2-day)" />
      <path d="M16 84 Q80 58 150 78 T340 70 V122 H16Z" fill="#7fe3c4" />
      <path d="M16 102 Q110 86 200 100 T340 94 V122 H16Z" fill="#3f9a9c" />
      <path
        d="M60 100 l12 -30 l12 30z M92 104 l10 -24 l10 24z M230 98 l13 -32 l13 32z M262 102 l10 -24 l10 24z M296 100 l12 -28 l12 28z"
        fill="#1f5c46"
      />
    </>
  );
}
function Pr2Sunset() {
  return (
    <>
      <rect x="16" y="16" width="324" height="106" fill="url(#pr2-sunset)" />
      <circle cx="178" cy="90" r="26" fill="#fff1c4" opacity="0.9" />
      <path
        d="M16 122 V92 L70 66 L118 92 L170 70 L230 98 L282 72 L340 94 V122Z"
        fill="#6b2f3a"
      />
      <path d="M16 122 V108 Q120 98 220 108 T340 104 V122Z" fill="#3a1d2a" />
      <path
        d="M110 44 q4 -4 8 0 q4 -4 8 0 M140 36 q3 -3 6 0 q3 -3 6 0"
        fill="none"
        stroke="#3a1d2a"
        strokeWidth="1.3"
      />
    </>
  );
}

export function SceneDetectScene() {
  const shots = [Pr2Beach, Pr2City, Pr2Forest, Pr2Sunset];
  return (
    <svg className="ai ai--pr2" viewBox="0 0 480 270">
      <defs>
        <Shot id="pr2-shot" />
        <clipPath id="pr2-prev">
          <rect x="16" y="16" width="324" height="106" />
        </clipPath>
        <Lin id="pr2-beach" stops={["#4fd8e8", "#a8ecd8"]} x2={0} y2={1} />
        <Lin id="pr2-night" stops={["#0d1b30", "#2c2a5e"]} x2={0} y2={1} />
        <Lin id="pr2-day" stops={["#a8ecd8", "#e6f6ee"]} x2={0} y2={1} />
        <Lin
          id="pr2-sunset"
          stops={["#ff6150", "#ff8f4f", "#ffc861"]}
          x2={0}
          y2={1}
        />
        <Lin id="pr2-line" stops={G.cool} />
        <Lin id="pr2-razor" stops={G.grade} x2={0} y2={1} />
      </defs>

      <g clipPath="url(#pr2-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "60px", "--cy": "150px", "--cz": 1.1 }}
        >
          {/* The flattened video: one shot at a time, then a contact sheet. */}
          {shots.map((S, k) => (
            <g
              key={k}
              className={`pr2-s pr2-s--${k + 1}`}
              style={{
                "--tx": `${PR2_TILES[k][0]}px`,
                "--ty": `${PR2_TILES[k][1]}px`,
              }}
            >
              <g clipPath="url(#pr2-prev)">
                <S />
              </g>
            </g>
          ))}
          <g className="pr2-sheet">
            <path className="pr2-sep" d="M178 16V122M16 69H340" />
            {PR2_TILES.map(([tx, ty], k) => (
              <g key={k} transform={`translate(${tx} ${ty})`}>
                <rect
                  x="21"
                  y="55"
                  width="34"
                  height="10"
                  rx="2"
                  fill="#08110f"
                  opacity="0.8"
                />
                <text className="ai-tag" x="25" y="62.5">
                  Shot {k + 1}
                </text>
              </g>
            ))}
          </g>

          {/* Frame difference over time. */}
          <rect x="16" y="122" width="324" height="76" fill="#0a1311" />
          <text className="ai-cap" x="24" y="133">
            Frame difference
          </text>
          <path className="pr2-thr" d="M28 152H330" />
          <text className="ai-cap pr2-thr-t" x="28" y="148">
            threshold
          </text>
          <path className="pr2-graph" d={PR2_GRAPH} pathLength="1" />
          {PR2_CUTS.map((c, k) => (
            <g key={c} className={`pr2-hit pr2-hit--${k + 1}`}>
              <circle
                cx={c}
                cy={PR2_PEAKS[k]}
                r="6"
                fill="none"
                stroke="#ffd88a"
                strokeOpacity="0.6"
              />
              <circle cx={c} cy={PR2_PEAKS[k]} r="2.6" fill="#ffd88a" />
            </g>
          ))}

          {/* The clip: one export, then split at every cut. */}
          {PR2_COLORS.map((col, k) => (
            <rect
              key={k}
              className="pr2-seg"
              style={{ "--sx": `${(k - 2) * 3}px` }}
              x={PR2_EDGES[k] + 0.6}
              y="187"
              width={PR2_EDGES[k + 1] - PR2_EDGES[k] - 1.2}
              height="7"
              rx="1.5"
              fill={col}
            />
          ))}
          <rect
            className="pr2-one"
            x="28"
            y="187"
            width="300"
            height="7"
            rx="1.5"
            fill="#a08cff"
          />
          {PR2_CUTS.map((c, k) => (
            <g
              key={c}
              className="pr2-razor"
              style={{ animationDelay: `${k * 0.12}s` }}
            >
              <path d={`M${c} 138V196`} stroke="url(#pr2-razor)" />
              <path d={`M${c} 181l3.5 3.5l-3.5 3.5l-3.5 -3.5z`} fill="#fff" />
            </g>
          ))}

          <g className="pr2-head">
            <path d="M28 126V197" stroke="#4fd8e8" strokeWidth="1.2" />
            <path d="M24 123h8l-4 5z" fill="#4fd8e8" />
          </g>
        </g>
      </g>
      <Frame />

      {/* Bin: one file, then a clip per shot. */}
      <Panel title="Project bin" />
      <g className="pr2-one">
        {PR2_COLORS.slice(0, 4).map((col, k) => (
          <rect
            key={k}
            x={360 + k * 5}
            y="46"
            width="5"
            height="16"
            fill={col}
          />
        ))}
        <text className="ai-tag" x="386" y="53">
          export.mp4
        </text>
        <text className="ai-cap" x="386" y="62">
          0:10 · 1 clip
        </text>
      </g>
      {PR2_COLORS.map((col, k) => (
        <g
          key={k}
          className="pr2-row"
          style={{ animationDelay: `${k * 0.1}s` }}
        >
          <rect
            x="360"
            y={46 + k * 28}
            width="20"
            height="16"
            rx="2"
            fill={col}
          />
          <text className="ai-tag" x="386" y={53 + k * 28}>
            Shot {String(k + 1).padStart(2, "0")}
          </text>
          <text className="ai-cap" x="386" y={62 + k * 28}>
            0:02
          </text>
        </g>
      ))}
    </svg>
  );
}

/* =====================================================================
   Speech to Text: a speaker on camera, the dialogue on A1. The AI listens,
   types a timed transcript word by word, then one click lays it on the
   timeline as captions and the subtitle appears on the shot.
   ===================================================================== */

const PR3_WAVE = (() => {
  const r = seeded(19);
  const xs = [];
  const hs = [];
  for (let x = 36; x <= 328; x += 4) {
    const pause = (x > 126 && x < 140) || (x > 214 && x < 226);
    const env = 0.35 + 0.65 * Math.abs(Math.sin(x * 0.07));
    xs.push(x);
    hs.push(pause ? 1.5 : 2 + env * r() * 18);
  }
  return barsPath(xs, hs, 182, 2.2);
})();

// Transcript words: [text, x, y] in the panel (8.5px mono: 5.1px a char).
const PR3_WORDS = [
  ["Let's", 362, 80],
  ["make", 392.6, 80],
  ["it", 418.1, 80],
  ["great,", 362, 112],
  ["together.", 397.7, 112],
];
const PR3_BLOCKS = [
  [36, 94, "Let's make it"],
  [134, 84, "great,"],
  [222, 106, "together."],
];

export function SpeechTextScene() {
  return (
    <svg className="ai ai--pr3" viewBox="0 0 480 270">
      <defs>
        <Shot id="pr3-shot" />
        <Lin id="pr3-wall" stops={["#173a44", "#0f2529"]} x2={0} y2={1} />
        <Lin id="pr3-top" stops={G.warm} x2={0} y2={1} />
        <Lin id="pr3-wave" stops={G.cool} />
        <Lin id="pr3-cap" stops={G.grade} />
      </defs>

      <g clipPath="url(#pr3-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "130px", "--cy": "88px", "--cz": 1.22 }}
        >
          {/* The set: soft window light and a plant. */}
          <rect x="16" y="16" width="324" height="134" fill="url(#pr3-wall)" />
          <rect
            x="214"
            y="30"
            width="86"
            height="72"
            rx="4"
            fill="#4fd8e8"
            opacity="0.14"
          />
          <path
            d="M257 30V102M214 66H300"
            stroke="#4fd8e8"
            strokeOpacity="0.22"
          />
          <path
            d="M286 150 l4 -26 h20 l4 26z"
            fill="#24363a"
            stroke="#0a1311"
          />
          <path
            d="M300 124 q-16 -20 -4 -40 q6 16 4 40 M300 124 q14 -18 4 -36 q-8 14 -4 36 M300 124 q-24 -8 -26 -26 q16 6 26 26"
            fill="#3f9a9c"
          />

          {/* The speaker. */}
          <path
            d="M90 150 Q92 112 130 108 Q168 112 170 150Z"
            fill="url(#pr3-top)"
          />
          <rect x="124" y="94" width="12" height="16" fill="#e0ab86" />
          <circle cx="130" cy="80" r="19" fill="#f2c19a" />
          <path
            d="M108 94 Q102 56 130 56 Q158 56 152 94 Q151 74 146 70 Q138 66 130 66 Q118 67 112 72 Q109 80 108 94Z"
            fill="#3a2433"
          />
          <circle cx="123" cy="81" r="1.8" fill="#08110f" />
          <circle cx="137" cy="81" r="1.8" fill="#08110f" />
          <ellipse
            className="pr3-mouth"
            cx="130"
            cy="90.5"
            rx="4"
            ry="2.4"
            fill="#7a2f3a"
          />
          <g className="pr3-waves">
            <path className="pr3-arc pr3-arc--1" d="M154 84 q4 6 0 12" />
            <path className="pr3-arc pr3-arc--2" d="M160 80 q6 10 0 20" />
            <path className="pr3-arc pr3-arc--3" d="M166 76 q8 14 0 28" />
          </g>

          {/* The subtitle, once the captions exist. */}
          <g className="pr3-subt">
            <rect
              x="96"
              y="128"
              width="164"
              height="15"
              rx="3"
              fill="#08110f"
              opacity="0.8"
            />
            <text className="pr3-sub" x="178" y="138.6" textAnchor="middle">
              Let's make it great, together.
            </text>
          </g>

          {/* Timeline: a caption track over the dialogue. */}
          <rect x="16" y="150" width="324" height="48" fill="#0a1311" />
          <text className="ai-cap" x="20" y="163">
            C1
          </text>
          <text className="ai-cap" x="20" y="185">
            A1
          </text>
          <path className="pr-rule" d="M34 168.5H332" />
          <path d={PR3_WAVE} fill="url(#pr3-wave)" />
          {PR3_BLOCKS.map(([x, w, t], k) => (
            <g
              key={t}
              className="pr3-block"
              style={{ animationDelay: `${k * 0.15}s` }}
            >
              <rect
                x={x}
                y="154"
                width={w}
                height="11"
                rx="2"
                fill="url(#pr3-cap)"
              />
              <text className="ai-on" x={x + 4} y="162">
                {t}
              </text>
            </g>
          ))}
          <g className="pr3-head">
            <path d="M36 152V197" stroke="#4fd8e8" strokeWidth="1.2" />
            <path d="M32 150h8l-4 5z" fill="#4fd8e8" />
          </g>
        </g>
        {/* Status while it works. */}
        <g className="pr3-st pr3-st--1">
          <rect
            x="24"
            y="24"
            width="62"
            height="13"
            rx="6.5"
            fill="#08110f"
            opacity="0.8"
          />
          <circle cx="32" cy="30.5" r="2.5" fill="#ff6150" />
          <text className="ai-tag" x="38" y="33.2">
            Listening
          </text>
        </g>
        <g className="pr3-st pr3-st--2">
          <rect
            x="24"
            y="24"
            width="74"
            height="13"
            rx="6.5"
            fill="#08110f"
            opacity="0.8"
          />
          <circle cx="32" cy="30.5" r="2.5" fill="#4fd8e8" />
          <text className="ai-tag" x="38" y="33.2">
            Transcribing
          </text>
        </g>
      </g>
      <Frame />

      {/* Transcript panel. */}
      <Panel title="Transcript" />
      <circle cx="366" cy="50" r="5" fill="#ffb547" />
      <text className="ai-cap" x="376" y="53">
        Speaker 1
      </text>
      <g className="pr3-skel">
        <rect
          className="pr3-bone"
          x="362"
          y="72"
          width="86"
          height="6"
          rx="3"
        />
        <rect
          className="pr3-bone"
          x="362"
          y="86"
          width="60"
          height="6"
          rx="3"
        />
        <rect
          className="pr3-bone"
          x="362"
          y="104"
          width="78"
          height="6"
          rx="3"
        />
      </g>
      <text
        className="ai-cap pr3-word"
        x="362"
        y="68"
        style={{ animationDelay: "0s" }}
      >
        00:00:01
      </text>
      <text
        className="ai-cap pr3-word"
        x="362"
        y="100"
        style={{ animationDelay: "0.96s" }}
      >
        00:00:03
      </text>
      {PR3_WORDS.map(([w, x, y], k) => (
        <g key={w}>
          <rect
            className="pr3-hl"
            style={{ animationDelay: `${k * 0.32}s` }}
            x={x - 1.5}
            y={y - 8.5}
            width={w.length * 5.1 + 3}
            height="11"
            rx="2"
          />
          <text
            className="pr3-w pr3-word"
            style={{ animationDelay: `${k * 0.32}s` }}
            x={x}
            y={y}
          >
            {w}
          </text>
        </g>
      ))}
      <g className="pr3-btn">
        <rect
          x="360"
          y="166"
          width="98"
          height="20"
          rx="6"
          fill="url(#pr3-cap)"
        />
        <text className="ai-chip__t" x="409" y="179" textAnchor="middle">
          Create captions
        </text>
      </g>
      <g className="pr3-cursor">
        <Cursor />
      </g>
    </svg>
  );
}

/* =====================================================================
   Enhance Speech: dialogue by a busy street. The waveform is buried in
   noise; a scan pulls the voice apart from it, the Enhance slider goes to
   100%, and what's left is clean speech.
   ===================================================================== */

// Voice bars and the noise band, cut into six chunks the scan clears in
// turn (x 16–340, 54 wide each).
const PR4 = (() => {
  const r = seeded(31);
  const chunk = (x) => Math.min(5, Math.floor((x - 16) / 54));
  const voice = Array.from({ length: 6 }, () => [[], []]);
  for (let x = 22; x <= 332; x += 5) {
    const burst = Math.max(0, Math.sin((x - 22) * 0.045)) ** 0.6;
    voice[chunk(x)][0].push(x);
    voice[chunk(x)][1].push(4 + burst * (20 + r() * 38));
  }
  const noise = Array.from({ length: 6 }, (_, k) => {
    const top = [];
    const bot = [];
    const x0 = 16 + k * 54;
    for (let x = x0; x <= x0 + 54; x += 3) {
      top.push(`${x} ${f1(151 - 7 - r() * 11)}`);
      bot.push(`${x} ${f1(151 + 7 + r() * 11)}`);
    }
    return `M${x0} 151 L${top.join(" L")} L${x0 + 54} 151 L${bot.reverse().join(" L")}Z`;
  });
  return {
    voice: voice.map(([xs, hs]) => barsPath(xs, hs, 151, 2.6)),
    noise,
  };
})();
// When the scan (30–47% of the loop over 324 px) reaches each chunk.
const pr4Delay = (k) => `${((1.7 * (54 * k + 27)) / 324).toFixed(3)}s`;

export function EnhanceSpeechScene() {
  return (
    <svg className="ai ai--pr4" viewBox="0 0 480 270">
      <defs>
        <Shot id="pr4-shot" />
        <Lin
          id="pr4-sky"
          stops={["#1d2550", "#5b4a8c", "#ff8f4f"]}
          x2={0}
          y2={1}
        />
        <Lin id="pr4-hood" stops={G.night} x2={0} y2={1} />
        <Lin id="pr4-voice" stops={G.grade} />
        <Lin id="pr4-chip" stops={G.grade} />
        <Lin id="pr4-warm" stops={G.warm} />
        <Lin id="pr4-cool" stops={G.cool} />
        <Lin
          id="pr4-beam"
          stops={["#4fd8e8", "#4fd8e8", "#4fd8e8"]}
          opacity={[0, 0.55, 0]}
        />
      </defs>

      <g clipPath="url(#pr4-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "90px", "--cy": "100px", "--cz": 1.15 }}
        >
          {/* The street. */}
          <rect x="16" y="16" width="324" height="88" fill="url(#pr4-sky)" />
          <path
            d="M16 92V54h30v-14h24v26h20V46h28v46zM170 92V50h34v20h22V36h30v56zM262 92V58h26v-16h22v24h30v26z"
            fill="#121a33"
          />
          <path
            d="M24 62h3v3h-3zM54 52h3v3h-3zM100 58h3v3h-3zM180 60h3v3h-3zM236 46h3v3h-3zM244 62h3v3h-3zM270 66h3v3h-3zM298 52h3v3h-3zM320 74h3v3h-3z"
            fill="#ffd88a"
            opacity="0.85"
          />
          <rect x="16" y="92" width="324" height="12" fill="#24363a" />
          <path
            d="M16 98H340"
            stroke="#ffd88a"
            strokeOpacity="0.5"
            strokeDasharray="8 7"
          />
          <g className="pr4-car">
            <path
              d="M236 94 v-8 q0 -4 4 -4 h8 l6 -7 h16 l7 7 h5 q4 0 4 4 v8z"
              fill="#ff6150"
            />
            <path d="M256 80 l4 -4 h9 l4 4z" fill="#a8ecd8" opacity="0.8" />
            <circle cx="246" cy="95" r="3.6" fill="#08110f" />
            <circle cx="276" cy="95" r="3.6" fill="#08110f" />
            <g className="pr4-honk">
              <path
                d="M230 82 l-7 -3 M230 87 h-8 M230 92 l-7 3"
                stroke="#ffd88a"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </g>
          </g>
          <g>
            <path
              d="M64 104 Q66 76 80 74 Q94 76 96 104Z"
              fill="url(#pr4-hood)"
            />
            <circle cx="80" cy="62" r="11" fill="#f2c19a" />
            <path
              d="M69 60 a11 11 0 0 1 22 0 q-6 -4 -11 -4 q-6 0 -11 4z"
              fill="#3a2433"
            />
            <circle cx="76.5" cy="62.5" r="1.3" fill="#08110f" />
            <circle cx="84" cy="62.5" r="1.3" fill="#08110f" />
            <ellipse
              className="pr4-mouth"
              cx="80.5"
              cy="67.5"
              rx="2.6"
              ry="1.6"
              fill="#7a2f3a"
            />
          </g>
          <g className="pr4-noisy">
            <path d="M96 52 q3 -3 6 0 t6 0 t6 0" />
            <path d="M100 62 q3 -3 6 0 t6 0 t6 0 t6 0" />
            <path d="M96 72 q3 -3 6 0 t6 0 t6 0" />
          </g>
          <g className="pr4-clear">
            <path className="pr4-arc pr4-arc--1" d="M94 60 q4 5 0 10" />
            <path className="pr4-arc pr4-arc--2" d="M100 56 q6 9 0 18" />
            <path className="pr4-arc pr4-arc--3" d="M106 52 q8 13 0 26" />
          </g>

          {/* The dialogue track. */}
          <rect x="16" y="104" width="324" height="94" fill="#0a1311" />
          <text className="ai-cap" x="30" y="116">
            A1 · Dialogue
          </text>
          <path className="pr-rule" d="M20 151.5H336" />
          {/* Grey voice under noise; each chunk turns clean as the scan passes. */}
          {PR4.voice.map((d, k) => (
            <path key={k} d={d} fill="#879592" opacity="0.55" />
          ))}
          <g className="pr4-noisebox">
            {PR4.noise.map((d, k) => (
              <path
                key={k}
                d={d}
                className="pr4-noise"
                style={{ animationDelay: pr4Delay(k) }}
              />
            ))}
          </g>
          {PR4.voice.map((d, k) => (
            <path
              key={k}
              d={d}
              className="pr4-voice"
              style={{ animationDelay: pr4Delay(k) }}
              fill="url(#pr4-voice)"
            />
          ))}
          <rect
            className="pr4-scan"
            x="16"
            y="104"
            width="30"
            height="94"
            fill="url(#pr4-beam)"
          />
        </g>
      </g>
      <Frame />

      {/* Essential Sound. */}
      <Panel title="Essential Sound" />
      <rect
        x="360"
        y="44"
        width="48"
        height="13"
        rx="6.5"
        fill="url(#pr4-chip)"
      />
      <text className="ai-chip__t" x="384" y="53" textAnchor="middle">
        Dialogue
      </text>
      <text className="ai-tag" x="362" y="78">
        Enhance
      </text>
      <rect
        x="432"
        y="69"
        width="22"
        height="11"
        rx="5.5"
        fill="rgb(255 255 255 / 0.14)"
      />
      <rect
        className="pr4-on"
        x="432"
        y="69"
        width="22"
        height="11"
        rx="5.5"
        fill="url(#pr4-cool)"
      />
      <circle className="pr4-knob" cx="448" cy="74.5" r="4" fill="#fff" />
      <text className="ai-cap" x="362" y="98">
        Mix amount
      </text>
      <text className="ai-cap pr4-v0" x="454" y="98" textAnchor="end">
        0%
      </text>
      <text className="ai-tag pr4-v1" x="454" y="98" textAnchor="end">
        100%
      </text>
      <rect
        x="362"
        y="104"
        width="92"
        height="3"
        rx="1.5"
        fill="rgb(255 255 255 / 0.12)"
      />
      <rect
        className="pr4-fill"
        x="362"
        y="104"
        width="92"
        height="3"
        rx="1.5"
        fill="url(#pr4-cool)"
      />
      <circle className="pr4-thumb" cx="454" cy="105.5" r="4" fill="#fff" />
      <text className="ai-cap" x="362" y="130">
        Noise
      </text>
      <rect
        x="362"
        y="135"
        width="92"
        height="6"
        rx="3"
        fill="rgb(255 255 255 / 0.08)"
      />
      <rect
        className="pr4-nm"
        x="362"
        y="135"
        width="92"
        height="6"
        rx="3"
        fill="url(#pr4-warm)"
      />
      <text className="ai-cap" x="362" y="160">
        Voice
      </text>
      <rect
        x="362"
        y="165"
        width="92"
        height="6"
        rx="3"
        fill="rgb(255 255 255 / 0.08)"
      />
      <rect
        className="pr4-vm"
        x="362"
        y="165"
        width="92"
        height="6"
        rx="3"
        fill="url(#pr4-cool)"
      />
    </svg>
  );
}

/* =====================================================================
   Generative Extend: the clip ends two seconds before the music's beat.
   The AI generates the missing frames into the gap, and the shot now holds
   right up to the beat, the new part tagged as generated.
   ===================================================================== */

const PR5_MUSIC = (() => {
  const r = seeded(43);
  const xs = [];
  const hs = [];
  for (let x = 34; x <= 298; x += 3.5) {
    const beat = Math.exp(-((x - 34) % 33) / 9);
    xs.push(x);
    hs.push(2 + (0.3 + 0.7 * beat) * (8 + r() * 12));
  }
  return barsPath(xs, hs, 181, 2);
})();
const PR5_TILES = [230.5, 253.6, 276.7];

export function GenExtendScene() {
  return (
    <svg className="ai ai--pr5" viewBox="0 0 480 270">
      <defs>
        <Shot id="pr5-shot" />
        <clipPath id="pr5-prev">
          <rect x="16" y="16" width="324" height="102" />
        </clipPath>
        <Lin
          id="pr5-sky"
          stops={["#5b4a8c", "#ff8f4f", "#ffd88a"]}
          x2={0}
          y2={1}
        />
        <Lin id="pr5-sea" stops={["#3f9a9c", "#1d3a6e"]} x2={0} y2={1} />
        <Lin id="pr5-music" stops={G.night} />
        <Lin id="pr5-grad" stops={G.grade} />
        <pattern id="pr5-px" width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="#fff" opacity="0.35" />
          <rect
            x="3.5"
            y="3.5"
            width="3"
            height="3"
            fill="#4fd8e8"
            opacity="0.3"
          />
        </pattern>
        <pattern
          id="pr5-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="2.4" height="6" fill="#ff6150" opacity="0.35" />
        </pattern>
        <symbol id="pr5-thumb" viewBox="0 0 26 20" preserveAspectRatio="none">
          <rect width="26" height="12" fill="url(#pr5-sky)" />
          <circle cx="17" cy="10" r="3.5" fill="#fff1c4" />
          <rect y="11" width="26" height="9" fill="url(#pr5-sea)" />
          <path d="M5 13 h7 M14 16 h6" stroke="#fff" strokeOpacity="0.5" />
        </symbol>
      </defs>

      <g clipPath="url(#pr5-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "265px", "--cy": "150px", "--cz": 1.2 }}
        >
          {/* Preview: a boat sails across a sunset. */}
          <g clipPath="url(#pr5-prev)">
            <rect x="16" y="16" width="324" height="102" fill="url(#pr5-sky)" />
            <circle
              className="pr5-sun"
              cx="226"
              cy="78"
              r="17"
              fill="#fff1c4"
              opacity="0.95"
            />
            <rect x="16" y="84" width="324" height="34" fill="url(#pr5-sea)" />
            <path
              d="M206 90h40M214 96h24M220 102h12"
              stroke="#fff1c4"
              strokeOpacity="0.6"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              className="pr5-wave"
              d="M0 100 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0"
            />
            <path
              className="pr5-wave pr5-wave--2"
              d="M0 110 q12 -4 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0"
            />
            <g className="pr5-boat">
              <path d="M58 86 h34 l-6 8 h-22z" fill="#24363a" />
              <path d="M74 84 V58 l14 26z" fill="#fff" />
              <path d="M72 84 V62 l-10 22z" fill="#ffd88a" />
            </g>
            <g className="pr5-shim">
              <rect
                x="16"
                y="16"
                width="324"
                height="102"
                fill="url(#pr5-px)"
              />
            </g>
            <g className="pr5-black">
              <rect x="16" y="16" width="324" height="102" fill="#050c0b" />
              <text className="ai-wait" x="178" y="71" textAnchor="middle">
                No media
              </text>
            </g>
          </g>
          {/* Timeline. */}
          <rect x="16" y="118" width="324" height="80" fill="#0a1311" />
          <path
            className="pr-rule"
            d="M34 129.5H334M34 126V129.5M67 126V129.5M100 126V129.5M133 126V129.5M166 126V129.5M199 126V129.5M232 126V129.5M265 126V129.5M298 126V129.5"
          />
          <text className="ai-cap" x="20" y="151">
            V1
          </text>
          <text className="ai-cap" x="20" y="184">
            A1
          </text>
          {Array.from({ length: 7 }, (_, k) => (
            <use
              key={k}
              href="#pr5-thumb"
              x={34.5 + k * 28}
              y="137"
              width="27"
              height="20"
            />
          ))}
          <rect
            x="34"
            y="136.5"
            width="196"
            height="21"
            rx="3"
            fill="none"
            stroke="rgb(255 255 255 / 0.35)"
          />
          <g className="pr5-gap">
            <rect
              x="230.5"
              y="136.5"
              width="69"
              height="21"
              rx="3"
              fill="url(#pr5-hatch)"
              stroke="#ff6150"
              strokeOpacity="0.7"
              strokeDasharray="3 2"
            />
            <text className="pr5-gap-t" x="265" y="150" textAnchor="middle">
              2 s gap
            </text>
          </g>
          {PR5_TILES.map((x, k) => (
            <g
              key={x}
              className="pr5-tile"
              style={{ animationDelay: `${k * 0.45}s` }}
            >
              <use href="#pr5-thumb" x={x} y="137" width="22.4" height="20" />
              <rect
                className="pr5-noise"
                style={{ animationDelay: `${k * 0.45}s` }}
                x={x}
                y="137"
                width="22.4"
                height="20"
                fill="url(#pr5-px)"
              />
            </g>
          ))}
          <rect
            className="pr5-out"
            x="230.5"
            y="136.5"
            width="69"
            height="21"
            rx="3"
            fill="none"
            stroke="url(#pr5-grad)"
            strokeWidth="1.4"
          />
          <g className="pr5-spark">
            <path d="M246 132 l1.4 3 l3 1.4 l-3 1.4 l-1.4 3 l-1.4 -3 l-3 -1.4 l3 -1.4z" />
            <path d="M284 160 l1.2 2.4 l2.4 1.2 l-2.4 1.2 l-1.2 2.4 l-1.2 -2.4 l-2.4 -1.2 l2.4 -1.2z" />
          </g>
          <path d={PR5_MUSIC} fill="url(#pr5-music)" />
          <path
            d="M300 124V196"
            stroke="#ffd88a"
            strokeOpacity="0.7"
            strokeDasharray="2 2"
          />
          <path d="M296 120h8v5l-4 3l-4 -3z" fill="#ffd88a" />
          <circle
            className="pr5-ring"
            cx="300"
            cy="124"
            r="6"
            fill="none"
            stroke="#ffd88a"
          />
          <text className="ai-cap" x="306" y="127">
            Beat
          </text>
          <g className="pr5-head">
            <path d="M0 121V197" stroke="#4fd8e8" strokeWidth="1.2" />
            <path d="M-4 119h8l-4 5z" fill="#4fd8e8" />
          </g>
        </g>
        <g className="pr5-chip pr5-chip--gen">
          <rect
            x="24"
            y="24"
            width="70"
            height="13"
            rx="6.5"
            fill="#08110f"
            opacity="0.8"
          />
          <circle
            className="pr5-dot"
            cx="32"
            cy="30.5"
            r="2.5"
            fill="#4fd8e8"
          />
          <text className="ai-tag" x="38" y="33.2">
            Generating
          </text>
        </g>
        <g className="pr5-chip pr5-chip--done">
          <rect
            x="24"
            y="24"
            width="62"
            height="13"
            rx="6.5"
            fill="url(#pr5-grad)"
          />
          <text className="ai-chip__t" x="55" y="33.2" textAnchor="middle">
            Generated
          </text>
        </g>
      </g>
      <Frame />

      {/* Generative Extend panel. */}
      <Panel title="Generative Extend" />
      <use href="#pr5-thumb" x="362" y="48" width="40" height="30" />
      <rect
        x="416"
        y="48"
        width="40"
        height="30"
        rx="2"
        fill="none"
        stroke="rgb(255 255 255 / 0.3)"
        strokeDasharray="3 2"
      />
      <use
        className="pr5-new"
        href="#pr5-thumb"
        x="416"
        y="48"
        width="40"
        height="30"
      />
      <path d="M405 63h8m-3 -3l3 3l-3 3" stroke="#879592" fill="none" />
      <text className="ai-cap" x="382" y="88" textAnchor="middle">
        Source
      </text>
      <text className="ai-cap" x="436" y="88" textAnchor="middle">
        AI frames
      </text>
      <text className="ai-cap" x="362" y="108">
        Generative video
      </text>
      <rect
        x="362"
        y="114"
        width="92"
        height="4"
        rx="2"
        fill="rgb(255 255 255 / 0.12)"
      />
      <rect
        className="pr5-prog"
        x="362"
        y="114"
        width="92"
        height="4"
        rx="2"
        fill="url(#pr5-grad)"
      />
      <text className="ai-cap" x="362" y="138">
        Length
      </text>
      <text className="ai-tag" x="454" y="138" textAnchor="end">
        +2.0 s
      </text>
      <g className="pr5-btn">
        <rect
          x="360"
          y="166"
          width="98"
          height="20"
          rx="6"
          fill="url(#pr5-grad)"
        />
        <text className="ai-chip__t" x="409" y="179" textAnchor="middle">
          Extend clip
        </text>
      </g>
      <g className="pr5-cursor">
        <Cursor />
      </g>
    </svg>
  );
}
