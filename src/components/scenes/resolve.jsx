import "../../styles/parts/scenes/resolve.css";
import { G, Lin, SHOT } from "../ToolAI";

/**
 * DaVinci Resolve, topics 2–5: Speed Warp, Depth Map, Face Refinement and
 * Super Scale. Same stage as the other demos: the shot on the left, a
 * Resolve-style panel on the right, one 10 s loop (styles/parts/scenes/
 * resolve.css). Base styles are each finished result.
 */

const f1 = (n) => Math.round(n * 10) / 10;

function ShotClip({ id }) {
  return (
    <clipPath id={id}>
      <rect x={SHOT.x} y={SHOT.y} width={SHOT.w} height={SHOT.h} rx="6" />
    </clipPath>
  );
}

function Frame() {
  return (
    <rect className="ai-frame" x="16" y="16" width="324" height="182" rx="6" />
  );
}

/** A small tag in the shot's top-left corner (dark plate, light text). */
function Tag({ w, children }) {
  return (
    <>
      <rect
        x="22"
        y="22"
        width={w}
        height="11"
        rx="2"
        fill="#08110f"
        opacity="0.78"
      />
      {children}
    </>
  );
}

/** Inspector slider: label, track and a fill that grows to --v. */
function Slider({ y, label, cls, v, fill }) {
  return (
    <g>
      <text className="ai-tag" x="360" y={y}>
        {label}
      </text>
      <rect
        x="360"
        y={y + 5}
        width="98"
        height="3.5"
        rx="1.75"
        className="dvs-track"
      />
      <rect
        className={`dvs-fill ${cls}`}
        x="360"
        y={y + 5}
        width="98"
        height="3.5"
        rx="1.75"
        fill={`url(#${fill})`}
        style={{ "--v": v }}
      />
    </g>
  );
}

/* =====================================================================
   Speed Warp: a ball on an arc. Slowed down, the 24 fps frames stutter;
   the Neural Engine maps the motion (optical flow) and generates the
   in-between frames, so the slow motion runs smooth.
   ===================================================================== */

const arcY = (x) => 60 + 110 * ((x - 178) / 118) ** 2;
const ORIG = [60, 119, 178, 237, 296];
const GEN = Array.from({ length: 17 }, (_, i) => 60 + (236 * i) / 16).filter(
  (_, i) => i % 4,
);
// Optical-flow field: arrows along the motion near the arc, still elsewhere.
const FLOW = [];
for (let gx = 36; gx <= 324; gx += 32) {
  for (let gy = 40; gy <= 176; gy += 34) {
    const d = gx >= 60 && gx <= 296 ? Math.abs(gy - arcY(gx)) : 99;
    const m = Math.exp(-((d / 28) ** 2));
    if (m < 0.1) {
      FLOW.push({ dot: true, x: gx, y: gy });
      continue;
    }
    const s = (1.864 * (gx - 178)) / 118;
    const a = Math.atan2(s, 1);
    const L = 5 + 13 * m;
    const [ux, uy] = [Math.cos(a), Math.sin(a)];
    const x1 = gx - (ux * L) / 2;
    const y1 = gy - (uy * L) / 2;
    const x2 = gx + (ux * L) / 2;
    const y2 = gy + (uy * L) / 2;
    const h = 3.6;
    FLOW.push({
      hot: m > 0.5,
      d: `M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}M${f1(x2 - h * Math.cos(a - 0.55))} ${f1(y2 - h * Math.sin(a - 0.55))}L${f1(x2)} ${f1(y2)}L${f1(x2 - h * Math.cos(a + 0.55))} ${f1(y2 - h * Math.sin(a + 0.55))}`,
    });
  }
}

function Ball() {
  return (
    <g className="dv2-spin">
      <circle r="11" fill="url(#dv2-ball)" />
      <path
        d="M-11 0H11M0 -11V11M-7.6 -8Q-1 0 -7.6 8M7.6 -8Q1 0 7.6 8"
        stroke="#7a2e14"
        strokeWidth="1.1"
        fill="none"
        opacity="0.55"
      />
    </g>
  );
}

export function SpeedWarpScene() {
  return (
    <svg className="ai ai--dv2" viewBox="0 0 480 270">
      <defs>
        <ShotClip id="dv2-shot" />
        <Lin
          id="dv2-sky"
          stops={["#123049", "#2d6f84", "#f0b27a"]}
          x2={0}
          y2={1}
        />
        <Lin id="dv2-ball" stops={G.warm} x2={1} y2={1} />
        <Lin id="dv2-path" stops={G.grade} />
        <Lin id="dv2-bar" stops={G.grade} />
      </defs>

      <g clipPath="url(#dv2-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "178px", "--cy": "112px", "--cz": 1.15 }}
        >
          <rect x="16" y="16" width="324" height="182" fill="url(#dv2-sky)" />
          <circle cx="74" cy="60" r="18" fill="#ffd88a" opacity="0.85" />
          <path
            d="M16 152V128H34V118H52V132H70V110H92V126H110V138H244V122H262V106H284V124H306V114H340V152Z"
            fill="#173b4a"
            opacity="0.85"
          />
          <rect x="16" y="172" width="324" height="26" fill="#1a2b2f" />
          <path
            d="M16 177H340"
            stroke="#ffd88a"
            strokeWidth="1.2"
            opacity="0.3"
          />

          {/* The original frames: five positions a second's worth apart. */}
          <g className="dv2-orig">
            {ORIG.map((x) => (
              <circle
                key={x}
                cx={x}
                cy={f1(arcY(x))}
                r="11"
                className="dv2-ghost"
              />
            ))}
          </g>
          {/* The motion it estimates. */}
          <path
            className="dv2-path"
            d="M60 170Q178 -50 296 170"
            pathLength="1"
          />
          <g className="dv2-flow">
            {FLOW.map((a, i) =>
              a.dot ? (
                <circle key={i} cx={a.x} cy={a.y} r="1" className="dv2-still" />
              ) : (
                <path
                  key={i}
                  d={a.d}
                  className={a.hot ? "dv2-arrow dv2-arrow--hot" : "dv2-arrow"}
                />
              ),
            )}
          </g>
          {/* The frames it generates in between. */}
          <g className="dv2-gen">
            {GEN.map((x) => (
              <circle
                key={x}
                cx={f1(x)}
                cy={f1(arcY(x))}
                r="7.5"
                className="dv2-new"
              />
            ))}
          </g>

          <g className="dv2-bx">
            <ellipse
              cx="0"
              cy="186"
              rx="11"
              ry="2.8"
              fill="#08110f"
              opacity="0.4"
            />
            <g className="dv2-by">
              <g className="dv2-ball">
                <Ball />
              </g>
            </g>
          </g>
        </g>
        <Tag w={88}>
          <text className="ai-tag dv2-t dv2-t--a" x="27" y="30">
            24 fps · stutter
          </text>
          <text className="ai-tag dv2-t dv2-t--b" x="27" y="30">
            96 fps · Speed Warp
          </text>
        </Tag>
      </g>
      <Frame />

      {/* Retime inspector. */}
      <text className="ai-cap" x="356" y="30">
        Retime
      </text>
      <rect className="ai-row" x="352" y="38" width="114" height="36" rx="7" />
      <text className="ai-tag" x="360" y="51">
        Speed
      </text>
      <text className="ai-tag dv2-v dv2-v--a" x="458" y="51" textAnchor="end">
        100%
      </text>
      <text className="ai-tag dv2-v dv2-v--b" x="458" y="51" textAnchor="end">
        25%
      </text>
      <rect x="360" y="59" width="98" height="4" rx="2" className="dvs-track" />
      <rect
        className="dv2-speed"
        x="360"
        y="59"
        width="98"
        height="4"
        rx="2"
        fill="url(#dv2-bar)"
      />

      <rect className="ai-row" x="352" y="80" width="114" height="36" rx="7" />
      <rect className="dv2-lit" x="352" y="80" width="114" height="36" rx="7" />
      <text className="ai-tag" x="360" y="93">
        Process
      </text>
      <text className="dv2-p dv2-p--a" x="360" y="107">
        Nearest frame
      </text>
      <text className="dv2-p dv2-p--b" x="360" y="107">
        Speed Warp
      </text>

      <rect className="ai-row" x="352" y="122" width="114" height="40" rx="7" />
      <text className="ai-tag" x="360" y="135">
        Frames / sec of motion
      </text>
      <text className="dv2-n" x="360" y="154">
        24
      </text>
      <text className="dv2-n dv2-n--b" x="387" y="154">
        → 96
      </text>

      {/* Frame strip: every original is followed by three generated. */}
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={f1(352.6 + i * 9.6)}
          y="168"
          width="8.4"
          height="22"
          rx="1.6"
          className={i % 4 ? "dv2-cell dv2-cell--gen" : "dv2-cell"}
        />
      ))}
      <rect
        x="352"
        y="204"
        width="6"
        height="6"
        rx="1"
        fill="#e6ece9"
        opacity="0.7"
      />
      <text className="ai-cap" x="361" y="210">
        Original
      </text>
      <rect x="404" y="204" width="6" height="6" rx="1" fill="#4fd8e8" />
      <text className="ai-cap" x="413" y="210">
        Generated
      </text>
    </svg>
  );
}

/* =====================================================================
   Depth Map: a flat shot (subject, trees, mountains). The AI estimates
   how far away every pixel is (near white, far black), then the depth is
   used to soften the background while the subject stays sharp.
   ===================================================================== */

const MOUNTAINS =
  "M16 122L58 88L96 108L140 70L188 104L232 80L280 106L340 84V198H16Z";
const HILLS = "M16 142Q90 122 170 138T340 132V198H16Z";
const GROUND = "M16 162Q110 150 200 158T340 154V198H16Z";
const PINES = [44, 70, 256, 284, 314];

function DepthWorld({ d }) {
  return (
    <g>
      <rect
        x="16"
        y="16"
        width="324"
        height="182"
        fill={`url(#dv3-${d ? "dsky" : "sky"})`}
      />
      {!d && <circle cx="74" cy="50" r="13" fill="#fff1c4" />}
      <path d={MOUNTAINS} fill={d ? "#2b2b2b" : "#8fb3c9"} />
      {!d && (
        <path
          d="M140 70L152 80L146 80L140 76L134 82L128 80Z"
          fill="#eef6f8"
          opacity="0.9"
        />
      )}
      <path d={HILLS} fill={d ? "#555" : "#5e9e86"} />
      {PINES.map((x) => (
        <g key={x}>
          <rect
            x={x - 2}
            y="132"
            width="4"
            height="12"
            fill={d ? "#7a7a7a" : "#4a3a2c"}
          />
          <path
            d={`M${x} 102L${x + 12} 126H${x - 12}Z`}
            fill={d ? "#8c8c8c" : "#2f7a5f"}
          />
          <path
            d={`M${x} 112L${x + 14} 136H${x - 14}Z`}
            fill={d ? "#858585" : "#24604b"}
          />
        </g>
      ))}
      <path d={GROUND} fill={`url(#dv3-${d ? "dground" : "ground"})`} />
    </g>
  );
}

function DepthPerson({ d }) {
  return (
    <g>
      <path
        d="M136 198C138 162 154 150 178 148C202 150 218 162 220 198Z"
        fill={d ? "#ececec" : "url(#dv3-shirt)"}
      />
      <rect
        x="171"
        y="128"
        width="14"
        height="22"
        rx="5"
        fill={d ? "#f2f2f2" : "#e8a27a"}
      />
      <ellipse
        cx="178"
        cy="112"
        rx="17"
        ry="20"
        fill={d ? "#fafafa" : "#f2b48c"}
      />
      <path
        d="M161 110C160 92 170 86 180 86C192 86 197 96 195 110C190 100 182 98 161 110Z"
        fill={d ? "#e4e4e4" : "#2c1d2e"}
      />
      {!d && (
        <>
          <circle cx="172" cy="113" r="1.6" fill="#08110f" />
          <circle cx="185" cy="113" r="1.6" fill="#08110f" />
          <path
            d="M172.5 121q5.5 4 11 0"
            stroke="#08110f"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
}

function Label({ x, y, w, children, dot }) {
  return (
    <g>
      <path
        d={`M${dot[0]} ${dot[1]}L${x + 4} ${y + 11}`}
        className="dv3-lead"
      />
      <circle cx={dot[0]} cy={dot[1]} r="1.8" fill="#4fd8e8" />
      <rect
        x={x}
        y={y}
        width={w}
        height="11"
        rx="2"
        fill="#08110f"
        opacity="0.8"
      />
      <text className="ai-tag" x={x + 4} y={y + 8}>
        {children}
      </text>
    </g>
  );
}

export function DepthMapScene() {
  return (
    <svg className="ai ai--dv3" viewBox="0 0 480 270">
      <defs>
        <ShotClip id="dv3-shot" />
        <clipPath id="dv3-wipe">
          <rect x="16" y="16" width="324" height="182" />
        </clipPath>
        <Lin
          id="dv3-sky"
          stops={["#7cc6e6", "#cfe9e6", "#ffe1a8"]}
          x2={0}
          y2={1}
        />
        <Lin id="dv3-ground" stops={["#7bc48f", "#4f9a6c"]} x2={0} y2={1} />
        <Lin id="dv3-dsky" stops={["#000", "#141414"]} x2={0} y2={1} />
        <Lin id="dv3-dground" stops={["#8f8f8f", "#dcdcdc"]} x2={0} y2={1} />
        <Lin id="dv3-shirt" stops={G.warm} x2={0} y2={1} />
        <Lin
          id="dv3-haze"
          stops={["#eaf4f2", "#eaf4f2", "#eaf4f2"]}
          x2={0}
          y2={1}
          opacity={[0.55, 0.42, 0.12]}
        />
        <Lin id="dv3-bar" stops={["#ffffff", "#7a7a7a", "#000000"]} />
        <Lin id="dv3-fill" stops={G.grade} />
        <Lin
          id="dv3-beam"
          stops={["#4fd8e8", "#4fd8e8", "#4fd8e8"]}
          opacity={[0, 0.6, 0]}
        />
        <radialGradient id="dv3-bokeh">
          <stop offset="0" stopColor="#fff6d8" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath="url(#dv3-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "178px", "--cy": "118px", "--cz": 1.18 }}
        >
          <DepthWorld />
          {/* Defocus: haze and bokeh over the background only. */}
          <g className="dv3-soft">
            <rect
              x="16"
              y="16"
              width="324"
              height="182"
              fill="url(#dv3-haze)"
            />
            <circle cx="56" cy="118" r="10" fill="url(#dv3-bokeh)" />
            <circle cx="262" cy="96" r="13" fill="url(#dv3-bokeh)" />
            <circle cx="300" cy="128" r="8" fill="url(#dv3-bokeh)" />
            <circle cx="104" cy="96" r="7" fill="url(#dv3-bokeh)" />
          </g>
          <DepthPerson />

          {/* The depth map, wiped in behind the scan. */}
          <g className="dv3-depth">
            <g className="dv3-win">
              <g clipPath="url(#dv3-wipe)">
                <g className="dv3-hold">
                  <DepthWorld d />
                  <DepthPerson d />
                </g>
              </g>
            </g>
          </g>
          <rect
            className="dv3-beam"
            x="330"
            y="16"
            width="22"
            height="182"
            fill="url(#dv3-beam)"
          />

          <g className="dv3-la">
            <Label x={214} y={84} w={36} dot={[196, 104]}>
              Subject
            </Label>
            <Label x={262} y={88} w={28} dot={[284, 106]}>
              Trees
            </Label>
            <Label x={92} y={50} w={44} dot={[140, 72]}>
              Mountains
            </Label>
          </g>
          <g className="dv3-lb">
            <Label x={214} y={84} w={36} dot={[196, 104]}>
              1.5 m
            </Label>
            <Label x={262} y={88} w={28} dot={[284, 106]}>
              40 m
            </Label>
            <Label x={92} y={50} w={44} dot={[140, 72]}>
              2 km
            </Label>
          </g>

          <g className="dv3-focus">
            <path
              d="M146 92V84H154M202 84H210V92M210 182V190H202M154 190H146V182"
              className="dv3-bracket"
            />
            <rect
              x="214"
              y="160"
              width="46"
              height="11"
              rx="2"
              fill="#08110f"
              opacity="0.8"
            />
            <text className="ai-tag" x="218" y="168">
              In focus
            </text>
          </g>
        </g>
      </g>
      <Frame />

      {/* Depth Map inspector. */}
      <text className="ai-cap" x="356" y="30">
        Depth Map
      </text>
      <rect className="ai-row" x="352" y="38" width="114" height="150" rx="8" />
      <rect x="360" y="46" width="98" height="10" rx="2" fill="url(#dv3-bar)" />
      <rect className="dv3-sel" x="410" y="43" width="49" height="16" rx="3" />
      <text className="ai-cap" x="360" y="68">
        Near
      </text>
      <text className="ai-cap" x="458" y="68" textAnchor="end">
        Far
      </text>
      <Slider y={88} label="Analyse depth" cls="dv3-an" v={1} fill="dv3-fill" />
      <Slider
        y={114}
        label="Blur far"
        cls="dv3-blur"
        v={0.75}
        fill="dv3-fill"
      />
      <text className="ai-tag" x="360" y="142">
        Focus
      </text>
      <text
        className="ai-tag dv3-fv dv3-fv--a"
        x="458"
        y="142"
        textAnchor="end"
      >
        —
      </text>
      <text
        className="ai-tag dv3-fv dv3-fv--b"
        x="458"
        y="142"
        textAnchor="end"
      >
        Subject
      </text>
      <rect
        x="360"
        y="160"
        width="98"
        height="18"
        rx="9"
        className="dvs-pill"
      />
      <circle cx="371" cy="169" r="3" fill="#4fd8e8" className="dv3-dot" />
      <text className="ai-tag" x="379" y="171.5">
        Neural Engine
      </text>
    </svg>
  );
}

/* =====================================================================
   Face Refinement: a close-up. The face is found and tracked, landmarks
   map the features, then skin smooths, the eyes brighten and the lips
   warm, only inside the face.
   ===================================================================== */

const LM = [
  [141, 98],
  [143, 114],
  [148, 128],
  [157, 139],
  [167, 144],
  [178, 146],
  [189, 144],
  [199, 139],
  [208, 128],
  [213, 114],
  [215, 98],
  [154, 87],
  [159, 84],
  [164, 83],
  [169, 84],
  [173, 86],
  [183, 86],
  [187, 84],
  [192, 83],
  [197, 84],
  [202, 87],
  [157, 98],
  [164, 95],
  [171, 98],
  [164, 101],
  [185, 98],
  [192, 95],
  [199, 98],
  [192, 101],
  [178, 92],
  [178, 100],
  [178, 108],
  [173, 112],
  [183, 112],
  [166, 124],
  [172, 121],
  [178, 122],
  [184, 121],
  [190, 124],
  [184, 129],
  [178, 130],
  [172, 129],
];
const MESH = [
  "M141 98L143 114L148 128L157 139L167 144L178 146L189 144L199 139L208 128L213 114L215 98",
  "M154 87L159 84L164 83L169 84L173 86M183 86L187 84L192 83L197 84L202 87",
  "M157 98L164 95L171 98L164 101ZM185 98L192 95L199 98L192 101Z",
  "M178 92L178 100L178 108L173 112M178 108L183 112",
  "M166 124L172 121L178 122L184 121L190 124L184 129L178 130L172 129Z",
  "M154 87L141 98M202 87L215 98M173 86L178 92L183 86M157 98L143 114M199 98L213 114",
  "M171 98L178 100L185 98M164 101L173 112M192 101L183 112M173 112L166 124M183 112L190 124",
  "M166 124L157 139M190 124L199 139M178 130L178 146M143 114L166 124M213 114L190 124",
].join("");

function Spark({ x, y, cls }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        className={`dv4-spark ${cls}`}
        d="M0 -7L1.5 -1.5L7 0L1.5 1.5L0 7L-1.5 1.5L-7 0L-1.5 -1.5Z"
      />
    </g>
  );
}

export function FaceRefineScene() {
  return (
    <svg className="ai ai--dv4" viewBox="0 0 480 270">
      <defs>
        <ShotClip id="dv4-shot" />
        <Lin
          id="dv4-bg"
          stops={["#13262b", "#24474a", "#3d6a68"]}
          x2={0}
          y2={1}
        />
        <Lin id="dv4-shirt" stops={G.night} x2={0} y2={1} />
        <Lin id="dv4-fill" stops={G.grade} />
        <radialGradient id="dv4-glow" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0" stopColor="#ffe6d2" stopOpacity="0.85" />
          <stop offset="0.7" stopColor="#ffd2b4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffd2b4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dv4-bokeh">
          <stop offset="0" stopColor="#7fe3c4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#7fe3c4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath="url(#dv4-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "178px", "--cy": "100px", "--cz": 1.22 }}
        >
          <rect x="16" y="16" width="324" height="182" fill="url(#dv4-bg)" />
          <circle cx="60" cy="64" r="26" fill="url(#dv4-bokeh)" />
          <circle cx="300" cy="150" r="30" fill="url(#dv4-bokeh)" />
          <circle cx="44" cy="160" r="18" fill="url(#dv4-bokeh)" />

          <g className="dv4-head">
            <path
              d="M92 198C96 170 126 156 178 154C230 156 260 170 264 198Z"
              fill="url(#dv4-shirt)"
            />
            <rect
              x="164"
              y="128"
              width="28"
              height="32"
              rx="9"
              fill="#e8a27a"
            />
            <ellipse cx="140" cy="104" rx="5.5" ry="9" fill="#e8a27a" />
            <ellipse cx="216" cy="104" rx="5.5" ry="9" fill="#e8a27a" />
            <ellipse cx="178" cy="100" rx="38" ry="46" fill="#f2b48c" />

            {/* What gets refined: blemishes and tired under-eyes. */}
            <g className="dv4-blem">
              <circle cx="152" cy="114" r="1.8" />
              <circle cx="157" cy="121" r="1.3" />
              <circle cx="205" cy="112" r="1.7" />
              <circle cx="199" cy="120" r="1.2" />
              <circle cx="171" cy="77" r="1.3" />
              <ellipse cx="164" cy="105" rx="7" ry="2" opacity="0.45" />
              <ellipse cx="192" cy="105" rx="7" ry="2" opacity="0.45" />
            </g>
            <ellipse
              className="dv4-glow"
              cx="178"
              cy="104"
              rx="34"
              ry="40"
              fill="url(#dv4-glow)"
            />

            <path
              d="M138 100C134 62 156 46 180 46C206 46 224 64 218 102C212 82 200 70 178 70C160 70 146 80 138 100Z"
              fill="#2c1d2e"
            />
            <path
              d="M155 87q9 -6 18 -1M183 86q9 -5 18 1"
              stroke="#2c1d2e"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="164" cy="98" rx="7" ry="4.2" fill="#fbf6f0" />
            <ellipse cx="192" cy="98" rx="7" ry="4.2" fill="#fbf6f0" />
            <circle cx="164.5" cy="98" r="3.3" fill="#4a3226" />
            <circle cx="192.5" cy="98" r="3.3" fill="#4a3226" />
            <circle cx="164.5" cy="98" r="1.5" fill="#08110f" />
            <circle cx="192.5" cy="98" r="1.5" fill="#08110f" />
            <circle cx="166" cy="96.6" r="1" fill="#fff" />
            <circle cx="194" cy="96.6" r="1" fill="#fff" />
            <path
              d="M178 99q-4 11 -1 13q3 1 6 -1"
              stroke="#c98a66"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M165 124Q172 119 178 121Q184 119 191 124Q178 133 165 124Z"
              fill="#b9675a"
            />
            <path
              className="dv4-lips"
              d="M165 124Q172 119 178 121Q184 119 191 124Q178 133 165 124Z"
              fill="#ec6a6f"
            />
            <Spark x={167} y={95.6} cls="dv4-spark--l" />
            <Spark x={195} y={95.6} cls="dv4-spark--r" />

            {/* Detection, then landmarks and the face mesh. */}
            <g className="dv4-box">
              <path
                d="M130 64V50H144M212 50H226V64M226 138V152H212M144 152H130V138"
                className="dv4-bracket"
              />
              <rect
                x="130"
                y="39"
                width="44"
                height="9"
                rx="2"
                fill="#4fd8e8"
              />
              <text className="ai-on" x="133.5" y="45.8">
                Face 99%
              </text>
            </g>
            <path className="dv4-mesh" d={MESH} pathLength="1" />
            <g className="dv4-dots">
              {LM.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="1.25" />
              ))}
            </g>
          </g>

          <g className="dv4-count">
            <rect
              x="236"
              y="150"
              width="62"
              height="11"
              rx="2"
              fill="#08110f"
              opacity="0.8"
            />
            <text className="ai-tag" x="240" y="158">
              42 landmarks
            </text>
          </g>
        </g>
      </g>
      <Frame />

      {/* Face Refinement inspector. */}
      <text className="ai-cap" x="356" y="30">
        Face Refinement
      </text>
      <rect className="ai-row" x="352" y="38" width="114" height="150" rx="8" />
      <circle cx="362" cy="52" r="3" fill="#4fd8e8" className="dv4-live" />
      <text className="ai-tag dv4-st dv4-st--a" x="370" y="55">
        Detecting face…
      </text>
      <text className="ai-tag dv4-st dv4-st--b" x="370" y="55">
        Tracking face
      </text>
      <path d="M360 64H458" stroke="rgb(255 255 255 / 0.08)" />
      <Slider y={80} label="Smoothing" cls="dv4-s1" v={0.7} fill="dv4-fill" />
      <Slider y={106} label="Eye light" cls="dv4-s2" v={0.55} fill="dv4-fill" />
      <Slider
        y={132}
        label="Lip colour"
        cls="dv4-s3"
        v={0.45}
        fill="dv4-fill"
      />
      <rect
        x="360"
        y="156"
        width="46"
        height="18"
        rx="9"
        className="dvs-pill"
      />
      <rect
        x="410"
        y="156"
        width="48"
        height="18"
        rx="9"
        className="dvs-pill"
      />
      <rect
        x="360"
        y="156"
        width="46"
        height="18"
        rx="9"
        className="dvs-lit dv4-c1"
      />
      <rect
        x="410"
        y="156"
        width="48"
        height="18"
        rx="9"
        className="dvs-lit dv4-c2"
      />
      <text className="ai-tag" x="383" y="167.5" textAnchor="middle">
        Before
      </text>
      <text className="ai-tag" x="434" y="167.5" textAnchor="middle">
        After
      </text>
    </svg>
  );
}

/* =====================================================================
   Super Scale: an HD frame, sampled into big soft pixels, is rebuilt as
   a sharp 4K frame behind a scan, with a before/after detail crop.
   ===================================================================== */

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const SKY = ["#4fd8e8", "#a8ecd8", "#ffd88a"];
const SKYC = SKY.map(hex);
const farY = (x) => 138 - 14 * Math.sin((x - 16) / 46);
const nearY = (x) => 164 - 9 * Math.sin((x + 40) / 38);
const STRIPES = ["#ff6150", "#ffc861", "#ff8f4f", "#ffc861", "#ff6150"];
const STRIPEC = STRIPES.map(hex);

function inBalloon(x, y) {
  if (((x - 178) / 36) ** 2 + ((y - 80) / 40) ** 2 <= 1) return true;
  if (y < 104 || y > 122) return false;
  return Math.abs(x - 178) <= 26 - (16 * (y - 104)) / 18;
}
function colorAt(x, y) {
  const t = (y - 16) / 182;
  let c =
    t < 0.5
      ? mix(SKYC[0], SKYC[1], t * 2)
      : mix(SKYC[1], SKYC[2], (t - 0.5) * 2);
  if ((x - 284) ** 2 + (y - 58) ** 2 <= 256) c = hex("#fff1c4");
  if (
    ((x - 84) / 22) ** 2 + ((y - 50) / 8) ** 2 <= 1 ||
    ((x - 100) / 14) ** 2 + ((y - 44) / 8) ** 2 <= 1
  )
    c = mix(c, [255, 255, 255], 0.85);
  if (y >= farY(x)) c = hex("#8fd9bf");
  if (y >= nearY(x)) c = hex("#3f9a9c");
  if (inBalloon(x, y))
    c = STRIPEC[Math.min(4, Math.max(0, Math.floor((x - 142) / 14.4)))];
  if (x >= 170 && x <= 186 && y >= 128 && y <= 140) c = hex("#8a5a3c");
  return c;
}
// The HD frame as big soft pixels: each 12-unit cell is the average of 3×3
// samples, quantised, and cells of one colour share a path.
const CELL = 12;
const PIXELS = (() => {
  const byColor = new Map();
  for (let y = 16; y < 198; y += CELL) {
    for (let x = 16; x < 340; x += CELL) {
      let acc = [0, 0, 0];
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
          const c = colorAt(x + 2 + i * 4, y + 2 + j * 4);
          acc = acc.map((v, k) => v + c[k] / 9);
        }
      const key =
        "#" +
        acc
          .map((v) =>
            Math.min(255, Math.round(v / 8) * 8)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("");
      byColor.set(
        key,
        (byColor.get(key) || "") + `M${x} ${y}h${CELL}v${CELL}h-${CELL}z`,
      );
    }
  }
  return [...byColor];
})();
const hillPath = (fn) => {
  let d = `M16 198L16 ${f1(fn(16))}`;
  for (let x = 22; x <= 340; x += 6) d += `L${x} ${f1(fn(x))}`;
  return `${d}L340 198Z`;
};

function Crisp() {
  return (
    <g id="dv5-crisp">
      <rect x="16" y="16" width="324" height="182" fill="url(#dv5-sky)" />
      <circle cx="284" cy="58" r="16" fill="#fff1c4" />
      <ellipse cx="84" cy="50" rx="22" ry="8" fill="#fff" opacity="0.85" />
      <ellipse cx="100" cy="44" rx="14" ry="8" fill="#fff" opacity="0.85" />
      <path
        d="M52 92q4 -3 8 0q4 -3 8 0M74 82q3 -2.4 6 0q3 -2.4 6 0"
        stroke="#1d3a4a"
        strokeWidth="1.2"
        fill="none"
      />
      <path d={hillPath(farY)} fill="#8fd9bf" />
      <path d={hillPath(nearY)} fill="#3f9a9c" />
      <g clipPath="url(#dv5-env)">
        {STRIPES.map((c, i) => (
          <rect
            key={i}
            x={f1(142 + i * 14.4)}
            y="38"
            width="14.6"
            height="86"
            fill={c}
          />
        ))}
        <path
          d="M152 104H204"
          stroke="#08110f"
          strokeOpacity="0.25"
          strokeWidth="1.2"
        />
      </g>
      <ellipse
        cx="178"
        cy="80"
        rx="36"
        ry="40"
        fill="none"
        stroke="#08110f"
        strokeOpacity="0.18"
      />
      <path
        d="M156 60Q164 46 180 44"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M170 122L172 128M186 122L184 128"
        stroke="#5a3a26"
        strokeWidth="1"
      />
      <rect x="170" y="128" width="16" height="12" rx="1.5" fill="#8a5a3c" />
      <path
        d="M170 132.5H186M170 136.5H186M175 128V140M181 128V140"
        stroke="#6b4129"
        strokeWidth="0.7"
      />
    </g>
  );
}

export function SuperScaleScene() {
  return (
    <svg className="ai ai--dv5" viewBox="0 0 480 270">
      <defs>
        <ShotClip id="dv5-shot" />
        <clipPath id="dv5-wipe">
          <rect x="16" y="16" width="324" height="182" />
        </clipPath>
        <clipPath id="dv5-env">
          <ellipse cx="178" cy="80" rx="36" ry="40" />
          <path d="M152 104H204L188 122H168Z" />
        </clipPath>
        <clipPath id="dv5-crop-a">
          <rect x="352" y="118" width="54" height="54" rx="4" />
        </clipPath>
        <clipPath id="dv5-crop-b">
          <rect x="412" y="118" width="54" height="54" rx="4" />
        </clipPath>
        <pattern
          id="dv5-grid"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <path d="M6 0V6H0" fill="none" stroke="#4fd8e8" strokeWidth="0.5" />
        </pattern>
        <Lin id="dv5-sky" stops={SKY} x2={0} y2={1} />
        <Lin id="dv5-fill" stops={G.grade} />
        <Lin
          id="dv5-beam"
          stops={["#4fd8e8", "#4fd8e8", "#4fd8e8"]}
          opacity={[0, 0.7, 0]}
        />
      </defs>

      <g clipPath="url(#dv5-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "178px", "--cy": "92px", "--cz": 1.35 }}
        >
          <g id="dv5-px" shapeRendering="crispEdges">
            {PIXELS.map(([c, d]) => (
              <path key={c} d={d} fill={c} />
            ))}
          </g>
          <g className="dv5-win">
            <g clipPath="url(#dv5-wipe)">
              <g className="dv5-hold">
                <Crisp />
              </g>
            </g>
          </g>
          {/* The scan: an upscale grid trailing a light edge. */}
          <g className="dv5-scan">
            <rect
              x="300"
              y="16"
              width="36"
              height="182"
              fill="url(#dv5-grid)"
              opacity="0.55"
            />
            <rect
              x="328"
              y="16"
              width="24"
              height="182"
              fill="url(#dv5-beam)"
            />
          </g>
        </g>
        <Tag w={74}>
          <text className="ai-tag dv5-t dv5-t--a" x="27" y="30">
            HD · 1920×1080
          </text>
          <text className="ai-tag dv5-t dv5-t--b" x="27" y="30">
            4K · 3840×2160
          </text>
        </Tag>
      </g>
      <Frame />

      {/* Super Scale inspector, with a before/after detail crop. */}
      <text className="ai-cap" x="356" y="30">
        Super Scale
      </text>
      <rect className="ai-row" x="352" y="38" width="114" height="62" rx="7" />
      <text className="ai-tag" x="360" y="52">
        Scale
      </text>
      <rect x="430" y="44" width="28" height="12" rx="6" className="dvs-pill" />
      <rect
        x="430"
        y="44"
        width="28"
        height="12"
        rx="6"
        className="dvs-lit dv5-chip"
      />
      <text className="ai-tag" x="444" y="52.5" textAnchor="middle">
        2×
      </text>
      <Slider y={68} label="Sharpness" cls="dv5-s1" v={0.6} fill="dv5-fill" />
      <Slider
        y={86}
        label="Noise reduction"
        cls="dv5-s2"
        v={0.4}
        fill="dv5-fill"
      />

      <text className="ai-cap" x="352" y="113">
        Before
      </text>
      <text className="ai-cap" x="412" y="113">
        After
      </text>
      <rect x="352" y="118" width="54" height="54" rx="4" fill="#050c0b" />
      <rect x="412" y="118" width="54" height="54" rx="4" fill="#050c0b" />
      <g clipPath="url(#dv5-crop-a)">
        <use
          href="#dv5-px"
          transform="translate(379 145) scale(1.8) translate(-197 -100)"
        />
      </g>
      <g clipPath="url(#dv5-crop-b)" className="dv5-after">
        <use
          href="#dv5-crisp"
          transform="translate(439 145) scale(1.8) translate(-197 -100)"
        />
      </g>
      <rect
        x="352"
        y="118"
        width="54"
        height="54"
        rx="4"
        className="dv5-crop"
      />
      <rect
        x="412"
        y="118"
        width="54"
        height="54"
        rx="4"
        className="dv5-crop dv5-crop--b"
      />

      <text
        className="ai-tag dv5-r dv5-r--a"
        x="409"
        y="190"
        textAnchor="middle"
      >
        1920 × 1080
      </text>
      <text
        className="ai-tag dv5-r dv5-r--b"
        x="409"
        y="190"
        textAnchor="middle"
      >
        3840 × 2160
      </text>
    </svg>
  );
}
