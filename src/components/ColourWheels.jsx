import { Scramble } from "./Kinetic";

// The classic primaries: shadows pushed cool, highlights pushed warm (the
// teal-and-orange grade), midtones left almost neutral.
const WHEELS = [
  { name: "Lift", note: "Shadows", dx: "-9%", dy: "15%", knob: "42%" },
  { name: "Gamma", note: "Midtones", dx: "6%", dy: "-5%", knob: "51%" },
  { name: "Gain", note: "Highlights", dx: "7%", dy: "-15%", knob: "60%" },
];

/**
 * Lift, gamma and gain wheels from the colour page of a grading suite.
 * The hue ring is one OKLCH sweep at constant lightness, so every hue sits
 * at the same weight, and each puck drifts slowly towards its grade. The
 * drift is transform-only and pauses with the Craft section off screen.
 */
export default function ColourWheels({ number }) {
  return (
    <div className="cw">
      <p className="label kit__title" aria-hidden="true">
        <span className="kit__no">({number}.2)</span> <Scramble text="Colour" />
      </p>
      <div
        className="cw__panel glass"
        role="img"
        aria-label="Colour grading wheels: lift, gamma and gain"
      >
        <div className="cw__bar label">
          <span>Primaries</span>
          <span className="cw__mode">Wheels</span>
        </div>
        <div className="cw__row">
          {WHEELS.map((w, i) => (
            <div
              className="cw__wheel"
              key={w.name}
              style={{ "--i": i, "--dx": w.dx, "--dy": w.dy, "--k": w.knob }}
            >
              <span className="label cw__name">
                <b>{w.name}</b>
                <span>{w.note}</span>
              </span>
              <span className="cw__disc">
                <span className="cw__puck" />
              </span>
              <span className="cw__dial">
                <span className="cw__knob" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
