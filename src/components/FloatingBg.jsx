// Decorative ambient layer behind every section: drifting theme-colour light,
// outlined type and keyframe marks. Pure CSS, frozen under reduced motion.
const words = [
  { text: "CUT", x: "6%", y: "14%", size: "16vw", dur: "38s", delay: "0s" },
  {
    text: "FRAME",
    x: "58%",
    y: "38%",
    size: "12vw",
    dur: "46s",
    delay: "-12s",
  },
  { text: "EDIT", x: "10%", y: "66%", size: "14vw", dur: "42s", delay: "-20s" },
  { text: "24", x: "74%", y: "82%", size: "18vw", dur: "50s", delay: "-6s" },
];
const marks = [
  { x: "18%", y: "30%", dur: "22s", delay: "0s", tone: "teal" },
  { x: "82%", y: "18%", dur: "26s", delay: "-8s", tone: "crimson" },
  { x: "46%", y: "72%", dur: "24s", delay: "-4s", tone: "teal" },
  { x: "90%", y: "60%", dur: "28s", delay: "-14s", tone: "crimson" },
  { x: "30%", y: "90%", dur: "20s", delay: "-10s", tone: "teal" },
];

export default function FloatingBg() {
  return (
    <div className="fbg" aria-hidden="true">
      <span className="fbg__orb fbg__orb--teal" />
      <span className="fbg__orb fbg__orb--deep" />
      <span className="fbg__orb fbg__orb--crimson" />
      <span className="fbg__orb fbg__orb--amber" />
      <span className="fbg__orb fbg__orb--violet" />
      {words.map((w) => (
        <span
          key={w.text}
          className="fbg__word"
          style={{
            "--x": w.x,
            "--y": w.y,
            "--s": w.size,
            "--d": w.dur,
            "--delay": w.delay,
          }}
        >
          {w.text}
        </span>
      ))}
      {marks.map((m) => (
        <span
          key={m.x + m.y}
          className={`fbg__mark fbg__mark--${m.tone}`}
          style={{ "--x": m.x, "--y": m.y, "--d": m.dur, "--delay": m.delay }}
        />
      ))}
    </div>
  );
}
