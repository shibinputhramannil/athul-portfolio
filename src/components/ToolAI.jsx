/**
 * The toolkit demos: one real AI feature of each piece of software, played
 * as a short cartoon on an 8 s loop in three phases shared by all three
 * (find the subject, process it, show the result), so the step list beside
 * each demo can follow along. SVG drawn in CSS motion (styles/parts/
 * Toolkit.css): transforms, opacity and stroke-dashoffset only, paused off
 * screen, with the finished result as a still frame under reduced motion.
 */

const G = {
  cool: ["#a8ecd8", "#4fd8e8"],
  grade: ["#4fd8e8", "#7fe3c4", "#f6d77a", "#ffb547", "#ff7a59"],
  warm: ["#ffc861", "#ff8f4f", "#ff6150"],
  night: ["#4fd8e8", "#6fb6ff", "#a08cff"],
};

function Lin({ id, stops, x2 = 1, y2 = 0, opacity }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map((c, i) => (
        <stop
          key={i}
          offset={i / (stops.length - 1)}
          stopColor={c}
          stopOpacity={opacity?.[i] ?? 1}
        />
      ))}
    </linearGradient>
  );
}

// The shot every demo is played in, and the status bar under it.
const SHOT = { x: 16, y: 16, w: 324, h: 182 };

function ShotFrame({ id }) {
  return (
    <>
      <clipPath id={id}>
        <rect x={SHOT.x} y={SHOT.y} width={SHOT.w} height={SHOT.h} rx="6" />
      </clipPath>
    </>
  );
}

// Gradients every demo uses, with ids unique to each demo.
function SharedDefs({ p }) {
  return (
    <defs>
      <Lin
        id={`${p}-beam`}
        stops={["#4fd8e8", "#4fd8e8", "#4fd8e8"]}
        opacity={[0, 0.55, 0]}
      />
    </defs>
  );
}

/* =====================================================================
   Premiere Pro: Auto Reframe. A skateboarder crosses a wide shot; the AI
   scans, locks on, tracks him, and a 9:16 window follows him. The phone
   shows the vertical result.
   ===================================================================== */

function Skater() {
  return (
    <g className="pr-skater">
      <g className="pr-flip">
        <rect
          x="70"
          y="166"
          width="40"
          height="5"
          rx="2.5"
          fill="url(#pr-board)"
        />
        <circle cx="78" cy="173.5" r="3.2" fill="#08110f" />
        <circle cx="102" cy="173.5" r="3.2" fill="#08110f" />
        <path
          d="M85 165 L87 151 M96 165 L94 151"
          stroke="#1d3a6e"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <path
          d="M81 131 L68 145 M99 131 L113 141"
          stroke="#ffb547"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <rect
          x="78"
          y="123"
          width="24"
          height="31"
          rx="10"
          fill="url(#pr-hoodie)"
        />
        <circle cx="90" cy="111" r="11" fill="#f2c19a" />
        <path d="M79 109 a11 11 0 0 1 22 0 h5 v3.2 h-27 z" fill="#4fd8e8" />
        <circle cx="93.5" cy="112" r="1.5" fill="#08110f" />
        <circle cx="98.5" cy="112" r="1.5" fill="#08110f" />
        <path
          d="M92.5 116.5 q3 2.6 6.2 0"
          stroke="#08110f"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

function ReframeScene() {
  return (
    <g>
      <rect
        x={SHOT.x}
        y={SHOT.y}
        width={SHOT.w}
        height={SHOT.h}
        fill="url(#pr-sky)"
      />
      <circle cx="268" cy="56" r="17" fill="#fff1c4" opacity="0.9" />
      <g className="pr-cloud">
        <ellipse cx="80" cy="50" rx="22" ry="8" fill="#fff" opacity="0.55" />
        <ellipse cx="96" cy="44" rx="14" ry="8" fill="#fff" opacity="0.55" />
      </g>
      <path
        d="M16 140 Q70 112 120 132 T220 126 T340 118 V198 H16Z"
        fill="#7fe3c4"
        opacity="0.6"
      />
      <path
        d="M16 158 Q90 140 160 156 T340 148 V198 H16Z"
        fill="#3f9a9c"
        opacity="0.85"
      />
      <rect x="16" y="171" width="324" height="27" fill="#24363a" />
      <path
        d="M16 186 H340"
        stroke="#ffd88a"
        strokeWidth="2"
        strokeDasharray="12 9"
        opacity="0.55"
      />
      <Skater />
    </g>
  );
}

export function ReframeDemo() {
  return (
    <svg className="ai ai--pr" viewBox="0 0 480 270">
      <SharedDefs p="pr" />
      <defs>
        <ShotFrame id="pr-shot" />
        <clipPath id="pr-phone">
          <rect x="366" y="26" width="92" height="164" rx="8" />
        </clipPath>
        <Lin
          id="pr-sky"
          stops={["#4fd8e8", "#a8ecd8", "#ffd88a"]}
          x2={0}
          y2={1}
        />
        <Lin id="pr-hoodie" stops={G.warm} x2={0} y2={1} />
        <Lin id="pr-board" stops={G.night} />
        <Lin id="pr-crop" stops={G.grade} x2={1} y2={1} />
      </defs>

      <g clipPath="url(#pr-shot)">
        <g className="cam cam--pr">
          <ReframeScene />
          <rect
            className="pr-scan"
            x="16"
            y="16"
            width="44"
            height="182"
            fill="url(#pr-beam)"
          />

          {/* Detection: brackets and a confidence tag that follow the skater. */}
          <g className="pr-detect">
            <path
              className="pr-detect__box"
              d="M63 108V97H74M106 97H117V108M117 166V177H106M74 177H63V166"
            />
            <rect x="63" y="85" width="54" height="10" rx="2" fill="#4fd8e8" />
            <text className="ai-on" x="66.5" y="92.6">
              Person 98%
            </text>
          </g>

          {/* The 9:16 window: everything outside it dims. */}
          <g className="pr-crop">
            <rect x="-561" y="0" width="600" height="220" className="pr-dim" />
            <rect x="141" y="0" width="600" height="220" className="pr-dim" />
            <rect
              x="39"
              y="17.5"
              width="102"
              height="179"
              rx="3"
              fill="none"
              stroke="url(#pr-crop)"
              strokeWidth="2.2"
            />
            <path
              d="M73 18V196M107 18V196M40 77H140M40 137H140"
              className="pr-thirds"
            />
            <rect
              x="44"
              y="22"
              width="22"
              height="10"
              rx="2"
              fill="#08110f"
              opacity="0.8"
            />
            <text x="47" y="29.5" className="ai-tag">
              9:16
            </text>
          </g>
        </g>
      </g>
      <rect
        className="ai-frame"
        x="16"
        y="16"
        width="324"
        height="182"
        rx="6"
      />

      {/* Phone: the vertical cut, following the same window. */}
      <rect
        className="ai-phone"
        x="358"
        y="18"
        width="108"
        height="180"
        rx="15"
      />
      <rect x="366" y="26" width="92" height="164" rx="8" fill="#050c0b" />
      <text className="ai-wait" x="412" y="111" textAnchor="middle">
        9:16
      </text>
      <g clipPath="url(#pr-phone)" className="pr-phone-on">
        <g transform="translate(366 26) scale(0.9011)">
          <g className="pr-cam">
            <ReframeScene />
          </g>
        </g>
      </g>
      <rect x="400" y="21" width="24" height="3" rx="1.5" fill="#1b2724" />
      <text className="ai-cap" x="412" y="212" textAnchor="middle">
        Vertical cut
      </text>
    </svg>
  );
}

/* =====================================================================
   After Effects: Roto Brush. One brush stroke on a dancer; the AI edge
   snaps around her and follows every frame; then a title slides in
   behind her, and the layer stack shows why that works.
   ===================================================================== */

const DANCER_OUTLINE =
  "M166 92 A12 12 0 0 1 190 92 L190 106 Q195 109 195 118 L195 150 L189 177 L167 177 L161 150 L161 118 Q161 109 166 106 Z";

export function RotoDemo() {
  return (
    <svg className="ai ai--ae" viewBox="0 0 480 270">
      <SharedDefs p="ae" />
      <defs>
        <ShotFrame id="ae-shot" />
        <Lin
          id="ae-sky"
          stops={["#0d1b30", "#2c2a5e", "#5b4a8c"]}
          x2={0}
          y2={1}
        />
        <Lin id="ae-shirt" stops={G.night} x2={0} y2={1} />
        <Lin id="ae-title" stops={G.warm} />
        <Lin id="ae-edge" stops={G.grade} x2={1} y2={1} />
      </defs>

      <g clipPath="url(#ae-shot)">
        <g className="cam cam--ae">
          {/* Background plate */}
          <rect x="16" y="16" width="324" height="182" fill="url(#ae-sky)" />
          <circle cx="290" cy="48" r="13" fill="#ffd88a" />
          <g fill="#fff" opacity="0.7">
            <circle cx="60" cy="40" r="1.2" />
            <circle cx="110" cy="28" r="1" />
            <circle cx="150" cy="52" r="1.3" />
            <circle cx="230" cy="34" r="1" />
            <circle cx="320" cy="76" r="1.1" />
          </g>
          <g fill="#0b1626">
            <rect x="16" y="120" width="34" height="78" />
            <rect x="50" y="98" width="28" height="100" />
            <rect x="250" y="106" width="30" height="92" />
            <rect x="280" y="128" width="26" height="70" />
            <rect x="306" y="92" width="34" height="106" />
          </g>
          <g fill="#ffc861" opacity="0.55">
            <rect x="56" y="108" width="5" height="5" />
            <rect x="66" y="122" width="5" height="5" />
            <rect x="258" y="116" width="5" height="5" />
            <rect x="268" y="134" width="5" height="5" />
            <rect x="314" y="104" width="5" height="5" />
            <rect x="326" y="120" width="5" height="5" />
          </g>
          <rect x="16" y="177" width="324" height="21" fill="#151c33" />
          <rect
            className="ae-dim"
            x="16"
            y="16"
            width="324"
            height="182"
            fill="#060b14"
          />

          {/* The title sits between the plate and the rotoscoped dancer. */}
          <text
            className="ae-title"
            x="178"
            y="142"
            textAnchor="middle"
            fill="url(#ae-title)"
          >
            MOTION
          </text>

          <g className="ae-dancer">
            <path
              d="M170 150 L166 176 M186 150 L190 176"
              stroke="#1d2a4a"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <g className="ae-arm ae-arm--l">
              <path
                d="M167 119 L150 103"
                stroke="#f2c19a"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
            </g>
            <g className="ae-arm ae-arm--r">
              <path
                d="M189 119 L206 101"
                stroke="#f2c19a"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
            </g>
            <rect
              x="164"
              y="111"
              width="28"
              height="41"
              rx="11"
              fill="url(#ae-shirt)"
            />
            <circle cx="178" cy="97" r="12" fill="#f2c19a" />
            <path
              d="M166 95 a12 12 0 0 1 24 0 q-6 -4 -12 -2 q-6 -3 -12 2z"
              fill="#2c1d2e"
            />
            <circle cx="174" cy="98" r="1.5" fill="#08110f" />
            <circle cx="182" cy="98" r="1.5" fill="#08110f" />
            <path
              d="M175 102.5 q3 2.4 6 0"
              stroke="#08110f"
              strokeWidth="1.3"
              fill="none"
              strokeLinecap="round"
            />

            {/* The matte the AI finds, and its edge. */}
            <path className="ae-matte" d={DANCER_OUTLINE} />
            <path className="ae-edge" d={DANCER_OUTLINE} pathLength="1" />
            {/* The one brush stroke that starts it. */}
            <path
              className="ae-brush"
              d="M172 102 C186 110, 168 122, 182 132 S170 150, 180 164"
              pathLength="1"
            />
          </g>

          <g className="ae-frames">
            <rect
              x="22"
              y="22"
              width="52"
              height="11"
              rx="2"
              fill="#08110f"
              opacity="0.75"
            />
            <text className="ai-tag ae-f ae-f--1" x="26" y="30">
              Frame 01
            </text>
            <text className="ai-tag ae-f ae-f--2" x="26" y="30">
              Frame 24
            </text>
            <text className="ai-tag ae-f ae-f--3" x="26" y="30">
              Frame 48
            </text>
          </g>
        </g>
      </g>
      <rect
        className="ai-frame"
        x="16"
        y="16"
        width="324"
        height="182"
        rx="6"
      />

      {/* Layer stack: the title moves between subject and background. */}
      <text className="ai-cap" x="356" y="30">
        Layers
      </text>
      <g className="ae-layer ae-layer--subject">
        <rect
          x="356"
          y="40"
          width="108"
          height="30"
          rx="6"
          className="ai-row"
        />
        <circle cx="370" cy="55" r="5" fill="url(#ae-shirt)" />
        <text x="381" y="58">
          Dancer · Roto
        </text>
      </g>
      <g className="ae-layer ae-layer--title">
        <rect
          x="356"
          y="78"
          width="108"
          height="30"
          rx="6"
          className="ai-row ai-row--hot"
        />
        <rect
          x="365"
          y="88"
          width="10"
          height="10"
          rx="2"
          fill="url(#ae-title)"
        />
        <text x="381" y="96">
          Title
        </text>
      </g>
      <g className="ae-layer ae-layer--bg">
        <rect
          x="356"
          y="78"
          width="108"
          height="30"
          rx="6"
          className="ai-row"
        />
        <rect
          x="365"
          y="88"
          width="10"
          height="10"
          rx="2"
          fill="url(#ae-sky)"
        />
        <text x="381" y="96">
          City plate
        </text>
      </g>
    </svg>
  );
}

/* =====================================================================
   DaVinci Resolve: Magic Mask. One stroke on the person; the Neural
   Engine scans and masks them; the background and the person are graded
   separately while the node graph lights up.
   ===================================================================== */

const PERSON =
  "M184 198 C186 168, 200 156, 220 154 C240 156, 254 168, 256 198 Z M220 150 C208 150, 204 140, 205 126 C206 108, 214 100, 222 100 C232 100, 238 110, 237 126 C236 140, 232 150, 220 150 Z";

function Person({ graded }) {
  return (
    <g>
      <path
        d="M184 198 C186 168, 200 156, 220 154 C240 156, 254 168, 256 198 Z"
        fill={graded ? "url(#dv-shirt)" : "#6f7976"}
      />
      <rect
        x="214"
        y="142"
        width="12"
        height="14"
        rx="4"
        fill={graded ? "#e8a27a" : "#a89a8d"}
      />
      <path
        d="M220 150 C208 150, 204 140, 205 126 C206 108, 214 100, 222 100 C232 100, 238 110, 237 126 C236 140, 232 150, 220 150 Z"
        fill={graded ? "#f2b48c" : "#b6a79a"}
      />
      <path
        d="M205 124 C204 104, 216 96, 224 97 C234 97, 240 106, 238 122 C233 112, 222 108, 205 124 Z"
        fill={graded ? "#2c1d2e" : "#3e3a3b"}
      />
      <circle cx="215" cy="126" r="1.7" fill="#08110f" />
      <circle cx="228" cy="126" r="1.7" fill="#08110f" />
      <path
        d="M216 135 q5.5 4 11 0"
        stroke="#08110f"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function Landscape({ graded }) {
  return (
    <g>
      <rect
        x="16"
        y="16"
        width="324"
        height="182"
        fill={`url(#dv-sky-${graded ? "g" : "l"})`}
      />
      {graded && (
        <circle cx="96" cy="74" r="34" fill="#ffc861" opacity="0.25" />
      )}
      <circle cx="96" cy="74" r="16" fill={graded ? "#ffd88a" : "#cfc9b8"} />
      <path
        d="M16 136 L60 112 L104 128 L150 102 L196 126 L246 106 L296 128 L340 112 V198 H16Z"
        fill={graded ? "#1d5a5c" : "#59605c"}
      />
      <path
        d="M16 160 L70 144 L120 158 L176 140 L230 160 L284 146 L340 162 V198 H16Z"
        fill={graded ? "#0b2f31" : "#454b48"}
      />
    </g>
  );
}

function Node({ y, n, label, cls }) {
  return (
    <g className={`dv-node ${cls}`}>
      <rect x="370" y={y} width="94" height="30" rx="7" className="ai-row" />
      <rect
        x="370"
        y={y}
        width="94"
        height="30"
        rx="7"
        className="dv-node__lit"
      />
      <circle cx="386" cy={y + 15} r="7.5" className="dv-node__no" />
      <text className="dv-node__n" x="386" y={y + 18} textAnchor="middle">
        {n}
      </text>
      <text x="399" y={y + 18.5}>
        {label}
      </text>
    </g>
  );
}

export function MaskDemo() {
  return (
    <svg className="ai ai--dv" viewBox="0 0 480 270">
      <SharedDefs p="dv" />
      <defs>
        <ShotFrame id="dv-shot" />
        <clipPath id="dv-person">
          <path d={PERSON} />
        </clipPath>
        <pattern
          id="dv-dots"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="3" r="0.9" fill="#6fb6ff" />
        </pattern>
        <Lin id="dv-sky-l" stops={["#5d6662", "#9a998e"]} x2={0} y2={1} />
        <Lin
          id="dv-sky-g"
          stops={["#0f5560", "#4fa6a8", "#ffb36b"]}
          x2={0}
          y2={1}
        />
        <Lin id="dv-shirt" stops={G.warm} x2={0} y2={1} />
      </defs>

      <g clipPath="url(#dv-shot)">
        <g className="cam cam--dv">
          <Landscape />
          <g className="dv-bg-grade">
            <Landscape graded />
          </g>
          <g className="dv-person">
            <Person />
            <g className="dv-person-grade">
              <Person graded />
            </g>
          </g>

          {/* Neural Engine scan inside the person, then the mask itself. */}
          <g clipPath="url(#dv-person)" className="dv-scan">
            <rect x="180" y="96" width="80" height="102" fill="url(#dv-dots)" />
            <rect
              className="dv-scanline"
              x="180"
              y="96"
              width="80"
              height="10"
              fill="#6fb6ff"
              opacity="0.45"
            />
          </g>
          <path className="dv-mask" d={PERSON} />
          <path
            className="dv-stroke"
            d="M221 108 C214 120, 228 132, 219 146 S226 170, 218 190"
            pathLength="1"
          />

          <rect
            x="22"
            y="22"
            width="44"
            height="11"
            rx="2"
            fill="#08110f"
            opacity="0.75"
          />
          <text className="ai-tag dv-tag dv-tag--log" x="27" y="30">
            Log
          </text>
          <text className="ai-tag dv-tag dv-tag--graded" x="27" y="30">
            Graded
          </text>
        </g>
      </g>
      <rect
        className="ai-frame"
        x="16"
        y="16"
        width="324"
        height="182"
        rx="6"
      />

      {/* Node graph: mask, then background and subject grades. */}
      <text className="ai-cap" x="356" y="30">
        Nodes
      </text>
      <path
        className="dv-wire dv-wire--1"
        d="M366 55 C352 55, 352 98, 370 98"
      />
      <path
        className="dv-wire dv-wire--2"
        d="M366 55 C346 55, 346 146, 370 146"
      />
      <Node y={40} n="01" label="Magic Mask" cls="dv-node--1" />
      <Node y={83} n="02" label="Background" cls="dv-node--2" />
      <Node y={131} n="03" label="Subject" cls="dv-node--3" />
    </svg>
  );
}
