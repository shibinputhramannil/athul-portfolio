/**
 * Tiny working screens for the toolkit cards: each shows the one job that
 * piece of software does in an edit. Drawn in SVG and animated in CSS
 * (styles/parts/Toolkit.css) with transforms and opacity, so they cost
 * almost nothing, pause off screen with the Craft section, and settle on a
 * meaningful still frame under reduced motion.
 */

const GRAD = {
  cool: ["#a8ecd8", "#4fd8e8"],
  grade: ["#4fd8e8", "#7fe3c4", "#f6d77a", "#ffb547", "#ff7a59"],
  warm: ["#ffc861", "#ff8f4f", "#ff6150"],
  night: ["#4fd8e8", "#6fb6ff", "#a08cff"],
};

function Grad({ id, stops, x1 = 0, x2 = 1, y1 = 0, y2 = 0, units, from, to }) {
  return (
    <linearGradient
      id={id}
      x1={from ?? x1}
      x2={to ?? x2}
      y1={y1}
      y2={y2}
      gradientUnits={units}
    >
      {stops.map((c, i) => (
        <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />
      ))}
    </linearGradient>
  );
}

/* ---------- Premiere Pro: cut ---------- */

// Ruler ticks every 12 units, taller every 48.
const RULER = Array.from({ length: 23 }, (_, i) => {
  const x = 28 + i * 12;
  return `M${x} ${i % 4 === 0 ? 91 : 93.5}V96`;
}).join("");

// A speech-like waveform on the audio track.
const WAVE = Array.from({ length: 66 }, (_, i) => {
  const x = 31 + i * 4;
  const a =
    1.5 +
    7 *
      Math.abs(Math.sin(i * 0.31 + 0.4) * Math.sin(i * 0.083 + 1.1)) *
      (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7)));
  return `M${x} ${(154 - a).toFixed(1)}V${(154 + a).toFixed(1)}`;
}).join("");

// A stand-in for footage: a subject (head and shoulders) on a graded plate.
function Shot({ id, fill, x }) {
  return (
    <g className={`tk-cut__shot tk-cut__shot--${id}`}>
      <rect x="97" y="11" width="126" height="70" rx="3" fill={fill} />
      <g fill="#08110f" fillOpacity="0.55">
        <circle cx={x} cy="40" r="10" />
        <path d={`M${x - 22} 81 q4 -26 22 -28 q18 2 22 28 Z`} />
      </g>
    </g>
  );
}

export function CutStage() {
  return (
    <svg className="tk tk--cut" viewBox="0 0 320 180">
      <defs>
        <Grad id="tkc-a" stops={GRAD.cool} x2={1} y2={1} />
        <Grad id="tkc-b" stops={GRAD.grade} x2={1} y2={1} />
        <Grad id="tkc-c" stops={GRAD.warm} x2={1} y2={1} />
        <Grad id="tkc-v2" stops={GRAD.night} />
        <Grad id="tkc-v1a" stops={GRAD.cool} />
        <Grad
          id="tkc-v1b"
          stops={GRAD.grade.slice(1, 4)}
          units="userSpaceOnUse"
          from={110}
          to={180}
        />
        <Grad id="tkc-v1c" stops={GRAD.warm} />
      </defs>

      {/* Program monitor: hard-cuts as the playhead crosses each clip. */}
      <rect
        className="tk__frame"
        x="96"
        y="10"
        width="128"
        height="72"
        rx="4"
      />
      <Shot id="a" fill="url(#tkc-a)" x={138} />
      <Shot id="b" fill="url(#tkc-b)" x={178} />
      <Shot id="c" fill="url(#tkc-c)" x={158} />

      {/* Timeline */}
      <path className="tk__ruler" d={`M28 96H292${RULER}`} />
      <text x="9" y="112">
        V2
      </text>
      <text x="9" y="132">
        V1
      </text>
      <text x="9" y="157">
        A1
      </text>

      <g className="tk-cut__title">
        <rect
          x="150"
          y="103"
          width="64"
          height="12"
          rx="3"
          fill="url(#tkc-v2)"
        />
        <text className="tk__on" x="155" y="111.5">
          T Title
        </text>
      </g>

      <rect
        className="tk__clip"
        x="28"
        y="121"
        width="80"
        height="17"
        rx="3"
        fill="url(#tkc-v1a)"
      />
      <rect
        className="tk__clip"
        x="110"
        y="121"
        width="35"
        height="17"
        rx="3"
        fill="url(#tkc-v1b)"
      />
      <rect
        className="tk__clip tk-cut__lift"
        x="145.5"
        y="121"
        width="34.5"
        height="17"
        rx="3"
        fill="url(#tkc-v1b)"
      />
      <rect
        className="tk__clip tk-cut__ripple"
        x="182"
        y="121"
        width="110"
        height="17"
        rx="3"
        fill="url(#tkc-v1c)"
      />
      <path className="tk-cut__razor" d="M145.2 116V143" />

      <rect
        className="tk-cut__audio"
        x="28"
        y="144"
        width="264"
        height="20"
        rx="3"
      />
      <path className="tk-cut__wave" d={WAVE} />

      <g className="tk-cut__head">
        <path className="tk__playhead" d="M24 84h8v4l-4 4l-4 -4z" />
        <path className="tk__playhead-line" d="M28 92V170" />
      </g>
    </svg>
  );
}

/* ---------- After Effects: animate ---------- */

const PATH = "M52 96 C 120 100, 150 18, 268 34";

function Key({ x, y, className = "" }) {
  return (
    <rect
      className={`tk-ae__key ${className}`}
      x={x - 3.2}
      y={y - 3.2}
      width="6.4"
      height="6.4"
      transform={`rotate(45 ${x} ${y})`}
    />
  );
}

export function AnimateStage() {
  return (
    <svg className="tk tk--ae" viewBox="0 0 320 180">
      <defs>
        <Grad id="tka-obj" stops={GRAD.night} x2={1} y2={1} />
        <Grad
          id="tka-path"
          stops={GRAD.night}
          units="userSpaceOnUse"
          from={52}
          to={268}
        />
        <Grad id="tka-bar" stops={GRAD.warm} y2={1} x2={0} />
      </defs>

      {/* Composition */}
      <rect
        className="tk__frame"
        x="20"
        y="8"
        width="280"
        height="104"
        rx="4"
      />
      <rect
        className="tk-ae__safe"
        x="34"
        y="16"
        width="252"
        height="88"
        rx="2"
      />

      {/* Bezier handles and the motion path, drawn as the layer travels. */}
      <path className="tk-ae__handle" d="M52 96L120 100M268 34L150 18" />
      <circle className="tk-ae__grip" cx="120" cy="100" r="2" />
      <circle className="tk-ae__grip" cx="150" cy="18" r="2" />
      <path className="tk-ae__path" d={PATH} />
      <path className="tk-ae__trace" d={PATH} pathLength="1" />
      <Key x={52} y={96} />
      <Key x={268} y={34} className="tk-ae__key--end" />

      {/* Onion skin, then the layer itself. */}
      <g opacity="0.12">
        <circle
          className="tk-ae__obj tk-ae__ghost3"
          cx="52"
          cy="96"
          r="9"
          fill="url(#tka-obj)"
        />
      </g>
      <g opacity="0.22">
        <circle
          className="tk-ae__obj tk-ae__ghost2"
          cx="52"
          cy="96"
          r="9"
          fill="url(#tka-obj)"
        />
      </g>
      <g opacity="0.38">
        <circle
          className="tk-ae__obj tk-ae__ghost1"
          cx="52"
          cy="96"
          r="9"
          fill="url(#tka-obj)"
        />
      </g>
      <g className="tk-ae__obj">
        <circle cx="52" cy="96" r="13" className="tk-ae__ring" />
        <circle cx="52" cy="96" r="9" fill="url(#tka-obj)" />
      </g>

      {/* A lower third arrives once the move lands, clear of the path. */}
      <g className="tk-ae__lower">
        <rect
          className="tk-ae__lbar"
          x="196"
          y="74"
          width="3"
          height="22"
          rx="1.5"
          fill="url(#tka-bar)"
        />
        <text className="tk-ae__lname" x="204" y="84">
          ADHUL U KRISHNA
        </text>
        <text className="tk-ae__lrole" x="204" y="93">
          Video editor
        </text>
      </g>

      {/* Timeline: two layers, their keyframes light as the time indicator passes. */}
      <text x="9" y="133">
        Shape
      </text>
      <text x="9" y="153">
        Title
      </text>
      <rect
        className="tk-ae__layer"
        x="60"
        y="125"
        width="240"
        height="11"
        rx="3"
      />
      <rect
        className="tk-ae__layer tk-ae__layer--title"
        x="196"
        y="145"
        width="104"
        height="11"
        rx="3"
      />
      <Key x={81} y={130.5} className="tk-ae__tl tk-ae__tl--1" />
      <Key x={222} y={130.5} className="tk-ae__tl tk-ae__tl--2" />
      <Key x={206} y={150.5} className="tk-ae__tl tk-ae__tl--3" />
      <Key x={232} y={150.5} className="tk-ae__tl tk-ae__tl--4" />
      <g className="tk-ae__cti">
        <path className="tk__playhead" d="M56 117h8v4l-4 4l-4 -4z" />
        <path className="tk__playhead-line" d="M60 125V170" />
      </g>
    </svg>
  );
}

/* ---------- DaVinci Resolve: grade ---------- */

function Scene({ graded }) {
  const id = graded ? "g" : "l";
  return (
    <svg
      className="tk-gr__scene"
      viewBox="0 0 280 104"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`tkg-sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          {graded ? (
            <>
              <stop offset="0" stopColor="#0f5560" />
              <stop offset="0.55" stopColor="#4fa6a8" />
              <stop offset="1" stopColor="#ffb36b" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#5d6662" />
              <stop offset="1" stopColor="#9a998e" />
            </>
          )}
        </linearGradient>
      </defs>
      <rect width="280" height="104" fill={`url(#tkg-sky-${id})`} />
      {graded && (
        <circle cx="196" cy="62" r="30" fill="#ffc861" opacity="0.28" />
      )}
      <circle cx="196" cy="62" r="14" fill={graded ? "#ffd88a" : "#c4c0b2"} />
      <path
        d="M0 70 L40 52 L78 64 L120 40 L160 60 L205 46 L240 62 L280 50 V104 H0Z"
        fill={graded ? "#1d5a5c" : "#565d59"}
      />
      <path
        d="M0 84 L50 70 L95 82 L140 66 L190 84 L235 72 L280 86 V104 H0Z"
        fill={graded ? "#0b2f31" : "#3f4542"}
      />
    </svg>
  );
}

// Scope traces for the RGB parade, one column per channel.
const traces = (x0, seed) =>
  Array.from({ length: 12 }, (_, i) => {
    const x = x0 + i * 3.4;
    const h = 8 + 22 * Math.abs(Math.sin(i * 0.9 + seed));
    return `M${x.toFixed(1)} 52V${(52 - h).toFixed(1)}`;
  }).join("");

export function GradeStage() {
  return (
    <div className="tk tk--grade">
      <div className="tk-gr__view">
        <Scene />
        <span className="tk-gr__tag tk-gr__tag--log">Log</span>
        <div className="tk-gr__graded">
          <Scene graded />
          <span className="tk-gr__tag tk-gr__tag--graded">Graded</span>
        </div>
        <span className="tk-gr__split" />
      </div>
      <svg className="tk-gr__tools" viewBox="0 0 280 60">
        <defs>
          <Grad id="tkg-curve" stops={GRAD.grade} />
        </defs>
        {/* Curves: the straight line bends into an S as the grade lands. */}
        <rect
          className="tk-gr__box"
          x="0.5"
          y="0.5"
          width="96"
          height="58"
          rx="3"
        />
        <path
          className="tk-gr__grid"
          d="M24.5 1V58M48.5 1V58M72.5 1V58M1 15H96M1 29.5H96M1 44H96"
        />
        <path className="tk-gr__line" d="M2 57L95 2" />
        <path
          className="tk-gr__curve"
          d="M2 57 C 30 56, 30 40, 48.5 29.5 S 70 4, 95 2"
          pathLength="1"
        />
        <circle className="tk-gr__pt tk-gr__pt--1" cx="26" cy="47" r="2.2" />
        <circle className="tk-gr__pt tk-gr__pt--2" cx="71" cy="11" r="2.2" />
        <text x="4" y="10">
          Curves
        </text>

        {/* RGB parade */}
        <rect
          className="tk-gr__box"
          x="108.5"
          y="0.5"
          width="171"
          height="58"
          rx="3"
        />
        <text x="112" y="10">
          Parade
        </text>
        <path className="tk-gr__tr tk-gr__tr--r" d={traces(118, 0.3)} />
        <path className="tk-gr__tr tk-gr__tr--g" d={traces(173, 1.4)} />
        <path className="tk-gr__tr tk-gr__tr--b" d={traces(228, 2.6)} />
      </svg>
    </div>
  );
}
