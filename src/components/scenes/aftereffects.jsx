import "../../styles/parts/scenes/aftereffects.css";
import { G, Lin, SHOT } from "../ToolAI";

/*
 * After Effects topics 2 to 5, each a 10 s scene on the shared timeline
 * (title card, find, process, result; see Toolkit.css). Base styles are
 * the finished result; the motion lives in scenes/aftereffects.css.
 */

function ShotClip({ id }) {
  return (
    <clipPath id={id}>
      <rect x={SHOT.x} y={SHOT.y} width={SHOT.w} height={SHOT.h} rx="6" />
    </clipPath>
  );
}

function Frame() {
  return (
    <rect
      className="ai-frame"
      x={SHOT.x}
      y={SHOT.y}
      width={SHOT.w}
      height={SHOT.h}
      rx="6"
    />
  );
}

/* =====================================================================
   Content-Aware Fill: a road sign spoils a dusk landscape. It is masked,
   patches sampled from around it (and from nearby frames) fill the hole
   tile by tile, and the clean plate holds as the shot moves on.
   ===================================================================== */

// Where each fill tile sits, and where its patch is sampled from.
const AE2_TILES = [
  { x: 216, y: 74, w: 24, h: 24, fx: -70, fy: -34 },
  { x: 240, y: 74, w: 24, h: 24, fx: 52, fy: -40 },
  { x: 216, y: 98, w: 24, h: 24, fx: -86, fy: 8 },
  { x: 240, y: 98, w: 24, h: 24, fx: 64, fy: 14 },
  { x: 234, y: 122, w: 10, h: 26, fx: -46, fy: 30 },
  { x: 234, y: 148, w: 10, h: 26, fx: 50, fy: 22 },
];

export function ContentFillScene() {
  return (
    <svg className="ai ai--ae2" viewBox="0 0 480 270">
      <defs>
        <ShotClip id="ae2-shot" />
        <Lin
          id="ae2-sky"
          stops={["#16234a", "#4b3f7e", "#c9837a"]}
          x2={0}
          y2={1}
        />
        <Lin id="ae2-chip" stops={G.grade} />
        {AE2_TILES.map((t, k) => (
          <clipPath id={`ae2-t${k}`} key={k}>
            <rect
              x={t.x - 0.5}
              y={t.y - 0.5}
              width={t.w + 1}
              height={t.h + 1}
            />
          </clipPath>
        ))}
        {[0, 1, 2].map((k) => (
          <clipPath id={`ae2-th${k}`} key={k}>
            <rect x={356 + k * 38} y="84" width="32" height="18" rx="2" />
          </clipPath>
        ))}

        {/* The clean plate: everything but the sign. */}
        <g id="ae2-plate">
          <rect x="0" y="16" width="360" height="182" fill="url(#ae2-sky)" />
          <circle cx="96" cy="66" r="15" fill="#ffd88a" opacity="0.9" />
          <g fill="#fff" opacity="0.6">
            <circle cx="52" cy="34" r="1" />
            <circle cx="140" cy="28" r="1.2" />
            <circle cx="206" cy="44" r="1" />
            <circle cx="318" cy="38" r="1.1" />
          </g>
          <path
            d="M0 124 L40 98 L70 112 L118 80 L160 108 L206 84 L252 110 L296 88 L360 106 V198 H0Z"
            fill="#2b2f5e"
          />
          <path d="M0 142 Q80 120 160 136 T360 128 V198 H0Z" fill="#1d3b4a" />
          <path d="M110 198 L174 134 L182 134 L262 198Z" fill="#202a3c" />
          <path
            d="M178 140 V196"
            stroke="#ffd88a"
            strokeWidth="2"
            strokeDasharray="6 7"
            opacity="0.6"
          />
        </g>
        {/* The sign the fill removes. */}
        <g id="ae2-sign">
          <rect x="236" y="116" width="4" height="56" fill="#3a4566" />
          <path
            d="M240 76 L262 98 L240 120 L218 98Z"
            fill="#ffc861"
            stroke="#08110f"
            strokeWidth="1.5"
          />
          <path
            d="M230 98 H248 M242 92 L248 98 L242 104"
            stroke="#08110f"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </defs>

      <g clipPath="url(#ae2-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "240px", "--cy": "112px", "--cz": 1.3 }}
        >
          <g className="ae2-pan">
            <use href="#ae2-plate" />
            <use href="#ae2-sign" className="ae2-sign" />

            {/* Patches sampled from around the hole fly in, tile by tile. */}
            {AE2_TILES.map((t, k) => (
              <g
                className="ae2-tile"
                key={k}
                style={{
                  "--fx": `${t.fx}px`,
                  "--fy": `${t.fy}px`,
                  animationDelay: `${k * 0.15}s`,
                }}
              >
                <g clipPath={`url(#ae2-t${k})`}>
                  <use href="#ae2-plate" />
                </g>
              </g>
            ))}
            <g className="ae2-seams">
              {AE2_TILES.map((t, k) => (
                <rect key={k} x={t.x} y={t.y} width={t.w} height={t.h} />
              ))}
            </g>
            {[0, 2, 3].map((k) => {
              const t = AE2_TILES[k];
              return (
                <rect
                  key={k}
                  className="ae2-sample"
                  x={t.x + t.fx}
                  y={t.y + t.fy}
                  width={t.w}
                  height={t.h}
                  style={{ animationDelay: `${k * 0.15}s` }}
                />
              );
            })}

            {/* The mask drawn around the sign. */}
            <path
              className="ae2-mask"
              d="M240 70 L268 98 L244 122 V176 H236 V122 L212 98 Z"
            />
            <path
              className="ae2-edge"
              d="M240 70 L268 98 L244 122 V176 H236 V122 L212 98 Z"
              pathLength="1"
            />
          </g>

          <g className="ae2-frames">
            <rect
              x="22"
              y="22"
              width="52"
              height="11"
              rx="2"
              fill="#08110f"
              opacity="0.75"
            />
            <text className="ai-tag ae2-f ae2-f--1" x="26" y="30">
              Frame 01
            </text>
            <text className="ai-tag ae2-f ae2-f--2" x="26" y="30">
              Frame 24
            </text>
            <text className="ai-tag ae2-f ae2-f--3" x="26" y="30">
              Frame 48
            </text>
          </g>
        </g>
      </g>
      <Frame />

      {/* Content-Aware Fill panel */}
      <text className="ai-cap" x="356" y="30">
        Content-Aware Fill
      </text>
      <rect x="356" y="38" width="108" height="22" rx="6" className="ai-row" />
      <text x="364" y="52">
        Fill method
      </text>
      <text className="ae2-val" x="456" y="52" textAnchor="end">
        Object
      </text>
      <text className="ai-cap" x="356" y="78">
        Reference frames
      </text>
      {[-34, 0, 34].map((dx, k) => (
        <g key={k}>
          <g clipPath={`url(#ae2-th${k})`}>
            <g
              transform={`translate(${356 + k * 38} 84) scale(0.0988) translate(-16 -16)`}
            >
              <use href="#ae2-plate" />
              <use href="#ae2-sign" transform={`translate(${dx} 0)`} />
            </g>
          </g>
          <rect
            x={356 + k * 38}
            y="84"
            width="32"
            height="18"
            rx="2"
            className="ae2-thumb"
          />
          <text
            className="ae2-small"
            x={372 + k * 38}
            y="112"
            textAnchor="middle"
          >
            {["t−12", "t", "t+12"][k]}
          </text>
        </g>
      ))}
      <rect className="ae2-hi" x="355" y="83" width="34" height="20" rx="3" />
      <text className="ai-cap" x="356" y="130">
        Rendering fill
      </text>
      <rect
        x="356"
        y="135"
        width="108"
        height="3"
        rx="1.5"
        fill="rgb(255 255 255 / 0.1)"
      />
      <rect
        className="ae2-prog"
        x="356"
        y="135"
        width="108"
        height="3"
        rx="1.5"
        fill="url(#ae2-chip)"
      />
      <g className="ae2-layer">
        <rect
          x="356"
          y="150"
          width="108"
          height="28"
          rx="6"
          className="ai-row ai-row--hot"
        />
        <rect
          x="365"
          y="159"
          width="10"
          height="10"
          rx="2"
          fill="url(#ae2-chip)"
        />
        <text className="ae2-val" x="381" y="167">
          Fill layer
        </text>
      </g>
    </svg>
  );
}

/* =====================================================================
   3D Camera Tracker: a dusk street pans past (far layers move less).
   Track points bloom on every layer, the solve lays a grid on the
   ground and a target, then 3D text stands on that spot and rides the
   parallax with the shot.
   ===================================================================== */

function Cross({ x, y, c }) {
  return (
    <path
      d={`M${x - 2.4} ${y - 2.4} L${x + 2.4} ${y + 2.4} M${x + 2.4} ${y - 2.4} L${x - 2.4} ${y + 2.4}`}
      stroke={c}
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  );
}

const C1 = "#4fd8e8";
const C2 = "#ffd88a";
const C3 = "#ff8f4f";
const C4 = "#7fe3c4";

export function CameraTrackScene() {
  return (
    <svg className="ai ai--ae3" viewBox="0 0 480 270">
      <defs>
        <ShotClip id="ae3-shot" />
        <Lin
          id="ae3-sky"
          stops={["#0d1b30", "#2c2a5e", "#7a5a8c"]}
          x2={0}
          y2={1}
        />
        <Lin id="ae3-ground" stops={["#20284a", "#0b1020"]} x2={0} y2={1} />
        <Lin id="ae3-text" stops={G.warm} x2={0} y2={1} />
        <Lin id="ae3-chip" stops={G.grade} />
      </defs>

      <g clipPath="url(#ae3-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "196px", "--cy": "140px", "--cz": 1.2 }}
        >
          <rect x="16" y="16" width="324" height="182" fill="url(#ae3-sky)" />
          <circle cx="70" cy="46" r="11" fill="#ffd88a" opacity="0.85" />
          <g fill="#fff" opacity="0.6">
            <circle cx="120" cy="30" r="1" />
            <circle cx="180" cy="50" r="1.2" />
            <circle cx="236" cy="28" r="1" />
            <circle cx="300" cy="60" r="1.1" />
          </g>

          {/* Far skyline: moves least. */}
          <g className="ae3-far">
            <path
              d="M-10 130 V104 H22 V96 H46 V108 H78 V92 H104 V112 H140 V100 H170 V110 H206 V94 H232 V106 H262 V90 H290 V104 H322 V98 H370 V130Z"
              fill="#3a4178"
            />
            <g fill="#ffd88a" opacity="0.35">
              <rect x="30" y="110" width="3" height="3" />
              <rect x="86" y="100" width="3" height="3" />
              <rect x="150" y="106" width="3" height="3" />
              <rect x="214" y="102" width="3" height="3" />
              <rect x="272" y="98" width="3" height="3" />
            </g>
            <g className="ae3-pts ae3-pts--far">
              <path
                className="ae3-dots"
                d="M30 104h0M62 108h0M90 100h0M122 112h0M156 104h0M186 110h0M224 100h0M248 108h0M276 96h0M306 104h0M336 100h0"
              />
              <Cross x={46} y={96} c={C4} />
              <Cross x={104} y={92} c={C1} />
              <Cross x={206} y={94} c={C2} />
              <Cross x={290} y={90} c={C4} />
            </g>
          </g>

          {/* Mid buildings either side of the street. */}
          <g className="ae3-mid">
            <path
              d="M-20 130 V58 H40 V72 H70 V130Z M280 130 V66 H312 V52 H380 V130Z"
              fill="#141a3a"
            />
            <g fill="#ffc861" opacity="0.5">
              <rect x="6" y="70" width="6" height="6" />
              <rect x="22" y="84" width="6" height="6" />
              <rect x="48" y="86" width="6" height="6" />
              <rect x="292" y="80" width="6" height="6" />
              <rect x="320" y="64" width="6" height="6" />
              <rect x="334" y="92" width="6" height="6" />
            </g>
            <g className="ae3-pts ae3-pts--mid">
              <path
                className="ae3-dots"
                d="M8 64h0M18 76h0M32 98h0M52 80h0M60 110h0M12 118h0M288 74h0M300 96h0M318 58h0M330 84h0M344 70h0M306 116h0"
              />
              <Cross x={40} y={58} c={C2} />
              <Cross x={70} y={72} c={C3} />
              <Cross x={25} y={87} c={C1} />
              <Cross x={280} y={66} c={C3} />
              <Cross x={312} y={52} c={C2} />
              <Cross x={295} y={83} c={C1} />
            </g>
          </g>

          {/* Ground: moves most. Grid, target and text live on it. */}
          <g className="ae3-near">
            <rect
              x="-30"
              y="128"
              width="420"
              height="70"
              fill="url(#ae3-ground)"
            />
            <path
              d="M178 128 L40 198 M178 128 L120 198 M178 128 L236 198 M178 128 L316 198"
              stroke="rgb(255 255 255 / 0.07)"
              strokeWidth="1"
            />
            {/* Street lamps */}
            <g>
              <path
                d="M64 176 V112 Q64 106 72 106 H78 M308 172 V114 Q308 108 300 108 H294"
                stroke="#2a3360"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="80" cy="108" r="3.5" fill="#ffd88a" />
              <circle cx="292" cy="110" r="3.5" fill="#ffd88a" />
              <ellipse
                cx="82"
                cy="178"
                rx="26"
                ry="4"
                fill="#ffd88a"
                opacity="0.08"
              />
              <ellipse
                cx="290"
                cy="174"
                rx="26"
                ry="4"
                fill="#ffd88a"
                opacity="0.08"
              />
            </g>
            <path
              className="ae3-grid"
              pathLength="1"
              d="M118 140 H238 M92 152 H264 M58 168 H298 M14 190 H342 M178 128 L60 198 M178 128 L119 198 M178 128 L237 198 M178 128 L296 198"
            />
            <g className="ae3-pts ae3-pts--near">
              <path
                className="ae3-dots"
                d="M100 140h0M140 136h0M176 144h0M228 152h0M270 140h0M66 160h0M110 170h0M150 162h0M244 174h0M300 166h0M44 188h0M128 194h0M200 192h0M266 190h0M320 194h0"
              />
              <Cross x={120} y={150} c={C1} />
              <Cross x={250} y={146} c={C2} />
              <Cross x={84} y={176} c={C3} />
              <Cross x={290} y={180} c={C4} />
              <Cross x={160} y={186} c={C2} />
              <Cross x={212} y={138} c={C1} />
            </g>

            {/* The target the solve offers on the ground plane. */}
            <g className="ae3-target">
              <ellipse
                cx="196"
                cy="168"
                rx="24"
                ry="7.5"
                fill="none"
                stroke="#ff6150"
                strokeWidth="2"
              />
              <ellipse
                cx="196"
                cy="168"
                rx="15"
                ry="4.7"
                fill="none"
                stroke="#ffd88a"
                strokeWidth="2"
              />
              <ellipse cx="196" cy="168" rx="6" ry="2" fill="#ff6150" />
            </g>

            {/* 3D text placed on the target. */}
            <g className="ae3-text">
              <ellipse
                cx="196"
                cy="168"
                rx="58"
                ry="5"
                fill="#000"
                opacity="0.4"
              />
              <text
                className="ae3-word ae3-word--back"
                x="199"
                y="163"
                textAnchor="middle"
              >
                STUDIO
              </text>
              <text className="ae3-word" x="196" y="166" textAnchor="middle">
                STUDIO
              </text>
            </g>
          </g>
        </g>
      </g>
      <Frame />

      {/* Tracker panel */}
      <text className="ai-cap" x="356" y="30">
        3D Camera Tracker
      </text>
      <rect x="356" y="38" width="108" height="22" rx="6" className="ai-row" />
      <text x="364" y="52">
        Analyse
      </text>
      <rect
        x="408"
        y="47.5"
        width="48"
        height="3"
        rx="1.5"
        fill="rgb(255 255 255 / 0.1)"
      />
      <rect
        className="ae3-bar ae3-bar--a"
        x="408"
        y="47.5"
        width="48"
        height="3"
        rx="1.5"
        fill="url(#ae3-chip)"
      />
      <rect x="356" y="66" width="108" height="22" rx="6" className="ai-row" />
      <text x="364" y="80">
        Solve
      </text>
      <rect
        x="408"
        y="75.5"
        width="48"
        height="3"
        rx="1.5"
        fill="rgb(255 255 255 / 0.1)"
      />
      <rect
        className="ae3-bar ae3-bar--b"
        x="408"
        y="75.5"
        width="48"
        height="3"
        rx="1.5"
        fill="url(#ae3-chip)"
      />
      <text className="ai-cap" x="356" y="108">
        Track points
      </text>
      <text className="ae3-val ae3-n ae3-n--1" x="464" y="108" textAnchor="end">
        0
      </text>
      <text className="ae3-val ae3-n ae3-n--2" x="464" y="108" textAnchor="end">
        186
      </text>
      <text className="ae3-val ae3-n ae3-n--3" x="464" y="108" textAnchor="end">
        412
      </text>
      <text className="ai-cap" x="356" y="124">
        Solve error
      </text>
      <text className="ae3-val ae3-err" x="464" y="124" textAnchor="end">
        0.32 px
      </text>

      {/* The solved camera path, seen from above. */}
      <rect x="356" y="134" width="108" height="56" rx="6" className="ai-row" />
      <text className="ae3-small" x="362" y="145">
        Camera
      </text>
      <path
        className="ae3-path"
        pathLength="1"
        d="M366 180 C392 182, 410 160, 452 156"
      />
      <g className="ae3-camera">
        <rect x="444" y="150" width="11" height="8" rx="1.5" fill="#4fd8e8" />
        <path d="M455 152 L460 149 V159 L455 156Z" fill="#4fd8e8" />
      </g>
    </svg>
  );
}

/* =====================================================================
   Graph Editor: a ball moves between two keyframes. Linear first (even
   spacing, a flat speed graph); Easy Ease bends the graph into a bell
   with handles; then the same move speeds up and settles.
   ===================================================================== */

// Ball travel (x 56 → 300) and the speed graph's frame.
const AE4_EASED = "0 9.3 0 26.3 0 39.8 0 46.6 0 46.6 0 39.8 0 26.3 0 9.3 0 400";

export function GraphEditorScene() {
  return (
    <svg className="ai ai--ae4" viewBox="0 0 480 270">
      <defs>
        <ShotClip id="ae4-shot" />
        <Lin id="ae4-ball" stops={G.warm} x2={1} y2={1} />
        <Lin id="ae4-curve" stops={G.grade} />
        <clipPath id="ae4-reveal-lin">
          <rect
            className="ae4-wipe ae4-wipe--lin"
            x="50"
            y="50"
            width="256"
            height="24"
          />
        </clipPath>
        <clipPath id="ae4-reveal-ease">
          <rect
            className="ae4-wipe ae4-wipe--ease"
            x="50"
            y="50"
            width="256"
            height="24"
          />
        </clipPath>
      </defs>

      <g clipPath="url(#ae4-shot)">
        <rect x="16" y="16" width="324" height="182" fill="#0b1424" />
        <path
          d="M16 40 H340 M16 64 H340 M16 88 H340 M64 16 V104 M124 16 V104 M184 16 V104 M244 16 V104 M304 16 V104"
          stroke="rgb(255 255 255 / 0.035)"
        />
        <text className="ae4-small" x="24" y="30">
          Composition
        </text>

        {/* Motion path and its two keyframes. */}
        <path
          d="M56 62 H300"
          stroke="rgb(255 255 255 / 0.18)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <rect x="53" y="59" width="6" height="6" fill="#ffd88a" />
        <rect x="297" y="59" width="6" height="6" fill="#ffd88a" />

        {/* Spacing trails: even when linear, bunched at the ends when eased. */}
        <g clipPath="url(#ae4-reveal-lin)">
          <path
            className="ae4-trail ae4-trail--lin"
            d="M56 62 H300"
            strokeDasharray="0 30.5"
          />
        </g>
        <g clipPath="url(#ae4-reveal-ease)">
          <path
            className="ae4-trail ae4-trail--ease"
            d="M56 62 H300"
            strokeDasharray={AE4_EASED}
          />
        </g>

        <g className="ae4-ball">
          <g className="ae4-squash">
            <circle cx="56" cy="62" r="11" fill="url(#ae4-ball)" />
            <circle cx="52" cy="58" r="3" fill="#fff" opacity="0.5" />
          </g>
        </g>

        {/* Speed graph */}
        <rect
          x="24"
          y="108"
          width="308"
          height="84"
          rx="5"
          fill="#070d18"
          stroke="rgb(255 255 255 / 0.08)"
        />
        <text className="ae4-small" x="32" y="120">
          Speed graph · px/s
        </text>
        <path
          d="M111 112 V188 M178 112 V188 M245 112 V188 M44 156 H312"
          stroke="rgb(255 255 255 / 0.05)"
        />
        <path d="M44 184 H312" stroke="rgb(255 255 255 / 0.18)" />
        <path className="ae4-lin" d="M44 184 V140 H312 V184" />
        <path
          className="ae4-ease"
          pathLength="1"
          d="M44 184 C134 184, 133 128, 178 128 S222 184, 312 184"
        />
        <g className="ae4-handle ae4-handle--l">
          <path d="M44 184 H126" />
          <circle cx="126" cy="184" r="2.6" />
        </g>
        <g className="ae4-handle ae4-handle--r">
          <path d="M312 184 H230" />
          <circle cx="230" cy="184" r="2.6" />
        </g>
        <rect x="41" y="181" width="6" height="6" fill="#ffd88a" />
        <rect x="309" y="181" width="6" height="6" fill="#ffd88a" />

        {/* Playhead: time runs evenly; the dot rides the speed. */}
        <g className="ae4-ph">
          <path d="M44 112 V188" stroke="#ff6150" strokeWidth="1" />
          <g className="ae4-ph-dot">
            <circle cx="44" cy="184" r="3.2" fill="#fff" />
          </g>
        </g>
      </g>
      <Frame />

      {/* Timeline panel */}
      <text className="ai-cap" x="356" y="30">
        Timeline
      </text>
      <rect x="356" y="38" width="108" height="26" rx="6" className="ai-row" />
      <text x="363" y="54">
        Position
      </text>
      <path d="M404 51 H458" stroke="rgb(255 255 255 / 0.15)" />
      <g className="ae4-kf ae4-kf--lin" fill="#ffd88a">
        <path d="M411 46 L416 51 L411 56 L406 51Z" />
        <path d="M451 46 L456 51 L451 56 L446 51Z" />
      </g>
      <g className="ae4-kf ae4-kf--ease" fill="#ffd88a">
        <path d="M407 46 H415 L411 51 L415 56 H407 L411 51Z" />
        <path d="M447 46 H455 L451 51 L455 56 H447 L451 51Z" />
      </g>

      <g className="ae4-btn">
        <rect
          x="356"
          y="74"
          width="108"
          height="22"
          rx="11"
          fill="rgb(255 255 255 / 0.05)"
          stroke="rgb(255 255 255 / 0.16)"
        />
        <rect
          className="ae4-btn-hi"
          x="356"
          y="74"
          width="108"
          height="22"
          rx="11"
          fill="url(#ae4-curve)"
        />
        <text className="ae4-btn-t" x="368" y="88">
          Easy Ease
        </text>
        <text className="ae4-btn-k" x="452" y="88" textAnchor="end">
          F9
        </text>
      </g>

      <g className="ae4-inf">
        <text className="ai-cap" x="356" y="114">
          Ease in
        </text>
        <text className="ae4-val" x="464" y="114" textAnchor="end">
          33%
        </text>
        <text className="ai-cap" x="356" y="128">
          Ease out
        </text>
        <text className="ae4-val" x="464" y="128" textAnchor="end">
          33%
        </text>
      </g>

      <rect x="356" y="140" width="108" height="50" rx="6" className="ai-row" />
      <path d="M364 156 H382" stroke="#4fd8e8" strokeWidth="1.6" />
      <text x="388" y="159">
        Linear
      </text>
      <g className="ae4-inf">
        <rect
          x="364"
          y="175"
          width="18"
          height="2"
          rx="1"
          fill="url(#ae4-curve)"
        />
        <text className="ae4-val" x="388" y="179">
          Eased
        </text>
      </g>
    </svg>
  );
}

/* =====================================================================
   Expressions: one line of code is typed on the logo's Position; the
   logo starts to wiggle (its motion path traces out); then two other
   layers are pick-whipped to it and follow along.
   ===================================================================== */

export function ExpressionScene() {
  return (
    <svg className="ai ai--ae5" viewBox="0 0 480 270">
      <defs>
        <ShotClip id="ae5-shot" />
        <Lin
          id="ae5-bg"
          stops={["#0d1b30", "#22264f", "#3d2f63"]}
          x2={0}
          y2={1}
        />
        <Lin id="ae5-ring" stops={G.grade} x2={1} y2={1} />
        <Lin id="ae5-warm" stops={G.warm} x2={1} y2={1} />
        <clipPath id="ae5-code">
          <rect x="357" y="39" width="106" height="44" rx="5" />
        </clipPath>
      </defs>

      <g clipPath="url(#ae5-shot)">
        <g
          className="ai-cam"
          style={{ "--cx": "150px", "--cy": "104px", "--cz": 1.15 }}
        >
          <rect x="16" y="16" width="324" height="182" fill="url(#ae5-bg)" />
          <g fill="#fff" opacity="0.55">
            <circle cx="40" cy="40" r="1" />
            <circle cx="96" cy="160" r="1.2" />
            <circle cx="200" cy="30" r="1" />
            <circle cx="300" cy="96" r="1.1" />
            <circle cx="320" cy="176" r="1" />
            <circle cx="62" cy="120" r="1" />
          </g>

          {/* Layer 2 and 3: they follow once pick-whipped. */}
          <g className="ae5-follow ae5-follow--ring">
            <circle
              cx="238"
              cy="72"
              r="12"
              fill="none"
              stroke="#4fd8e8"
              strokeWidth="3"
            />
            <circle cx="238" cy="72" r="3" fill="#4fd8e8" />
          </g>
          <g className="ae5-follow ae5-follow--dot">
            <rect
              x="238"
              y="138"
              width="17"
              height="17"
              rx="4"
              fill="#ffd88a"
            />
          </g>

          {/* Layer 1: the logo, with its selection box and anchor. */}
          <g className="ae5-logo">
            <circle
              cx="150"
              cy="104"
              r="24"
              fill="#0a1311"
              stroke="url(#ae5-ring)"
              strokeWidth="3.5"
            />
            <path d="M143 92 L163 104 L143 116Z" fill="url(#ae5-warm)" />
            <rect
              x="122"
              y="76"
              width="56"
              height="56"
              fill="none"
              stroke="rgb(255 255 255 / 0.45)"
              strokeWidth="0.7"
              strokeDasharray="2 2"
            />
            <g fill="#4fd8e8">
              <rect x="120.5" y="74.5" width="3" height="3" />
              <rect x="176.5" y="74.5" width="3" height="3" />
              <rect x="120.5" y="130.5" width="3" height="3" />
              <rect x="176.5" y="130.5" width="3" height="3" />
            </g>
          </g>

          {/* The wiggle's motion path, as After Effects draws it. */}
          <g className="ae5-trace">
            <path
              className="ae5-trace__line"
              d="M150 104 C140 110, 134 116, 132 114 S158 86, 164 88 S176 106, 172 112 S146 126, 142 124 S124 102, 128 98 S152 82, 156 84"
            />
            <g fill="#4fd8e8">
              <circle cx="132" cy="114" r="1.8" />
              <circle cx="164" cy="88" r="1.8" />
              <circle cx="172" cy="112" r="1.8" />
              <circle cx="142" cy="124" r="1.8" />
              <circle cx="128" cy="98" r="1.8" />
              <circle cx="156" cy="84" r="1.8" />
            </g>
          </g>
        </g>
      </g>
      <Frame />

      {/* Expression editor */}
      <text className="ai-cap" x="356" y="30">
        Position · Expression
      </text>
      <rect
        x="356"
        y="38"
        width="108"
        height="46"
        rx="6"
        fill="#060b12"
        stroke="rgb(255 255 255 / 0.14)"
        strokeWidth="0.8"
      />
      <g clipPath="url(#ae5-code)">
        <text className="ae5-ln" x="362" y="56">
          1
        </text>
        <text className="ae5-code" x="372" y="56">
          <tspan className="ae5-fn">wiggle</tspan>(
          <tspan className="ae5-num">2</tspan>,{" "}
          <tspan className="ae5-num">30</tspan>)
        </text>
        <g className="ae5-cover">
          <rect x="371" y="47" width="70" height="12" fill="#060b12" />
          <g className="ae5-caret-on">
            <rect
              className="ae5-caret"
              x="371"
              y="48"
              width="1.2"
              height="10"
            />
          </g>
        </g>
        <text className="ae5-ln" x="362" y="72">
          2
        </text>
        <text className="ae5-comment" x="372" y="72">
          // 2× a second, 30 px
        </text>
      </g>

      {/* Layers, with pick whips from layer 2 and 3 to the logo. */}
      <rect
        x="356"
        y="94"
        width="108"
        height="26"
        rx="6"
        className="ai-row ai-row--hot"
      />
      <rect
        x="364"
        y="102"
        width="10"
        height="10"
        rx="5"
        fill="url(#ae5-ring)"
      />
      <text className="ae5-name" x="380" y="110">
        Logo
      </text>
      <g className="ae5-fx">
        <rect
          x="420"
          y="101"
          width="22"
          height="12"
          rx="6"
          fill="url(#ae5-ring)"
        />
        <text className="ai-chip__t" x="431" y="109.5" textAnchor="middle">
          ƒx
        </text>
      </g>

      <rect x="356" y="128" width="108" height="26" rx="6" className="ai-row" />
      <circle
        cx="369"
        cy="141"
        r="5"
        fill="none"
        stroke="#4fd8e8"
        strokeWidth="2"
      />
      <text className="ae5-name" x="380" y="144">
        Ring
      </text>
      <rect x="356" y="162" width="108" height="26" rx="6" className="ai-row" />
      <rect x="364" y="170" width="10" height="10" rx="2.5" fill="#ffd88a" />
      <text className="ae5-name" x="380" y="178">
        Dot
      </text>

      <g className="ae5-whip ae5-whip--1">
        <text className="ae5-link" x="440" y="144" textAnchor="end">
          → Logo
        </text>
        <circle cx="451" cy="141" r="3.6" className="ae5-spiral" />
      </g>
      <g className="ae5-whip ae5-whip--2">
        <text className="ae5-link" x="440" y="178" textAnchor="end">
          → Logo
        </text>
        <circle cx="451" cy="175" r="3.6" className="ae5-spiral" />
      </g>
      <path
        className="ae5-line ae5-line--1"
        pathLength="1"
        d="M455 139 C472 132, 472 112, 446 107"
      />
      <path
        className="ae5-line ae5-line--2"
        pathLength="1"
        d="M455 173 C478 160, 478 114, 448 108"
      />
    </svg>
  );
}
