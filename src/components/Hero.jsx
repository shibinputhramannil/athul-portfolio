import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { Scramble, SplitText, WordRoll } from "./Kinetic";
import { timecode } from "../lib/media";
import { docTop, usePauseOffscreen, useScrollFrame } from "../lib/ticker";
import p480 from "../assets/profile-480.webp";
import p720 from "../assets/profile-720.webp";
import p940 from "../assets/profile-940.webp";

// Read on every scroll frame: one cached query, not a new one each time.
const reducedMQ =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
const scrollDrivenWords =
  typeof window !== "undefined" &&
  !!window.CSS?.supports?.("animation-timeline: view()");

const srcSet = `${p480} 480w, ${p720} 720w, ${p940} 940w`;
const sizes = "(max-width: 760px) 92vw, 46vw";

// Vectorscope trace: a seeded point cloud along the skin-tone line (123°)
// and its teal opposite, the classic teal-and-orange grade.
function buildScope() {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const C = 60;
  const R = 54;
  const polar = (deg, r) => {
    const a = (deg * Math.PI) / 180;
    return {
      x: +(C + r * Math.cos(a)).toFixed(1),
      y: +(C - r * Math.sin(a)).toFixed(1),
    };
  };
  const trace = [
    ...Array.from({ length: 34 }, () =>
      polar(123 + (rand() - 0.5) * 22, R * (0.12 + rand() * 0.48)),
    ),
    ...Array.from({ length: 18 }, () =>
      polar(303 + (rand() - 0.5) * 26, R * (0.1 + rand() * 0.36)),
    ),
    ...Array.from({ length: 10 }, () => polar(rand() * 360, R * rand() * 0.12)),
  ].map((p, i) => ({ ...p, d: (i % 9) * 0.35 }));
  const targets = [
    { deg: 103, l: "R" },
    { deg: 61, l: "MG" },
    { deg: 347, l: "B" },
    { deg: 283, l: "CY" },
    { deg: 241, l: "G" },
    { deg: 167, l: "YL" },
  ].map((t) => ({
    ...t,
    ...polar(t.deg, R * 0.76),
    lp: polar(t.deg, R * 0.94),
  }));
  return { trace, targets, skin: polar(123, R) };
}

const badgeText = "VIDEO EDITOR ✦ MOTION ✦ COLOUR ✦ SOUND ✦ ";
const pad = (n) => String(n).padStart(2, "0");
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default function Hero({ profile, editCount }) {
  const stageRef = useRef(null);
  const portraitRef = useRef(null);
  const subjectRef = useRef(null);
  const introRef = useRef(null);
  const summaryRef = useRef(null);
  const tcRef = useRef(null);
  const scope = useMemo(buildScope, []);
  const hasWork = editCount > 0;

  const [first, ...rest] = profile.name.split(" ");
  const restName = rest.join(" ");
  // The summary lights up word by word as you read. Key skills are single
  // units in their own grade (one gradient and underline per phrase, never
  // split across lines), with punctuation kept outside the highlight.
  const tokens = useMemo(() => {
    const phrases = [
      [["storytelling"], "cool"],
      [["visual", "effects"], "night"],
      [["colour", "grading"], "dawn"],
      [["color", "grading"], "dawn"],
      [["sound", "design"], "warm"],
      [["audio", "editing"], "warm"],
    ];
    const clean = (w) => w.toLowerCase().replace(/[^a-z]/g, "");
    const words = profile.summary.split(" ");
    const used = new Set();
    const out = [];
    for (let i = 0; i < words.length;) {
      const hit = phrases.find(
        ([phrase, tone]) =>
          !used.has(tone) &&
          phrase.every((p, j) => clean(words[i + j] ?? "") === p),
      );
      if (!hit) {
        out.push({ text: words[i] });
        i += 1;
        continue;
      }
      const [phrase, tone] = hit;
      used.add(tone);
      const [, text, tail] = words
        .slice(i, i + phrase.length)
        .join(" ")
        .match(/^(.*?)([.,;:!?]*)$/);
      out.push({ text, tone, tail });
      i += phrase.length;
    }
    return out;
  }, [profile.summary]);

  const firstYear = [...profile.experience]
    .map((j) => j.period.slice(0, 4))
    .sort()[0];
  const stats = [
    firstYear && {
      value: firstYear,
      label: "Editing since",
      note: profile.experience[profile.experience.length - 1]?.company,
    },
    {
      value: pad(profile.experience.length),
      label: "Studios",
      note: profile.experience.map((j) => j.company).join(" · "),
    },
    hasWork && {
      value: pad(editCount),
      label: "Edits on show",
      note: "Vertical cuts, 9:16",
    },
    {
      value: pad(profile.languages.length),
      label: "Languages",
      note: profile.languages.map((l) => l.name).join(" · "),
    },
  ].filter(Boolean);

  const scopesRef = useRef(null);
  const visible = useRef(true);
  const geo = useRef({ stageTop: 0, stageH: 1, sumTop: 0, sumH: 1 });
  const motionState = useRef({ x: 0, y: 0, p: 0, q: 0, sum: -1, wide: true });

  // Decorative loops (orbit, badge, scopes, meters) pause off screen.
  usePauseOffscreen(stageRef);

  // Track whether the stage is on screen, so its timecode idles.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // One writer for every depth layer: pointer parallax and scroll-out
  // combine into a single transform per element.
  const apply = useCallback(() => {
    const m = motionState.current;
    const stage = stageRef.current;
    if (!stage) return;
    const tx = (k) => (m.x * k).toFixed(2);
    const ty = (k) => (m.y * k).toFixed(2);
    stage.querySelectorAll("[data-name-scroll]").forEach((el) => {
      el.style.transform = `translate3d(${tx(-14)}px, calc(${(-m.p * 38).toFixed(2)}% + ${ty(-10)}px), 0)`;
    });
    if (subjectRef.current)
      subjectRef.current.style.transform = `translate3d(${tx(10)}px, calc(${(m.p * 6).toFixed(2)}% + ${ty(6)}px), 0) scale(${(1 + m.p * 0.08).toFixed(4)})`;
    if (scopesRef.current)
      scopesRef.current.style.transform = `translate3d(${tx(18)}px, ${ty(12)}px, 0)`;
    if (introRef.current) {
      introRef.current.style.transform = m.wide
        ? `translate3d(0, ${(-m.q * 80).toFixed(1)}px, 0)`
        : "";
      introRef.current.style.opacity = m.wide ? (1 - m.q).toFixed(3) : "";
    }
  }, []);

  // Running record timecode (only while the stage is visible).
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    let raf = 0;
    let last = -1;
    let idle = 0;
    // Runs every frame only while the stage is on screen; otherwise checks
    // back a few times a second.
    const tick = (now) => {
      if (!visible.current) {
        raf = 0;
        idle = setTimeout(() => (raf = requestAnimationFrame(tick)), 300);
        return;
      }
      const f = Math.floor(((now - start) / 1000) * 24);
      if (f !== last && !still.matches && tcRef.current) {
        last = f;
        tcRef.current.textContent = timecode(f / 24);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
    };
  }, []);

  // Pointer parallax across the depth layers.
  useEffect(() => {
    const stage = stageRef.current;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!stage || !fine.matches || still.matches) return;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let rect = null;
    const m = motionState.current;
    const step = () => {
      m.x += (tx - m.x) * 0.08;
      m.y += (ty - m.y) * 0.08;
      apply();
      raf =
        Math.abs(tx - m.x) > 0.001 || Math.abs(ty - m.y) > 0.001
          ? requestAnimationFrame(step)
          : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const move = (e) => {
      if (!rect) rect = stage.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      kick();
    };
    const leave = () => {
      rect = null;
      if (tx === 0 && ty === 0) return;
      tx = 0;
      ty = 0;
      kick();
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", leave, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", leave);
    };
  }, [apply]);

  // Liquid type: the name's letters swell in width (variable font axis)
  // around the pointer, like a ripple passing through the word.
  useEffect(() => {
    const stage = stageRef.current;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!stage || !fine.matches || still.matches) return;
    const back = Array.from(
      stage.querySelectorAll(".name__word--back [data-l]"),
    );
    const front = Array.from(
      stage.querySelectorAll(".name__word--front [data-l]"),
    );
    const current = back.map(() => 75);
    let px = null;
    let raf = 0;
    // Browsers send synthetic moves (with no movement) when the layout
    // changes under a resting pointer; only a real hand on the mouse wakes
    // the ripple, so the name never swells on its own while the page loads.
    let armed = false;
    const apply = () => {
      raf = 0;
      // Read every letter first, then write, so each frame lays out once.
      const centres = back.map((el) => {
        const r = el.getBoundingClientRect();
        return { c: r.left + r.width / 2, w: r.width || 1 };
      });
      centres.forEach(({ c, w }, i) => {
        const d = px == null ? Infinity : Math.abs(px - c) / w;
        const target = Math.round(75 + 32 * Math.max(0, 1 - d / 1.4));
        if (target !== current[i]) {
          current[i] = target;
          back[i].style.fontStretch = `${target}%`;
          if (front[i]) front[i].style.fontStretch = `${target}%`;
        }
      });
    };
    const move = (e) => {
      if (!armed) {
        if (!e.movementX && !e.movementY) return;
        armed = true;
      }
      px = e.clientX;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => {
      if (!armed) return;
      px = null;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
    };
  }, []);

  // Grade split: hover the portrait to compare the flat "log" look with the grade.
  useEffect(() => {
    const portrait = portraitRef.current;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!portrait || !fine.matches || still.matches) return;
    let timer = 0;
    let rect = null;
    let raf = 0;
    let pct = 100;
    const enter = () => {
      clearTimeout(timer);
      rect = portrait.getBoundingClientRect();
      portrait.classList.remove("is-release");
      portrait.classList.add("is-scrub");
    };
    const move = (e) => {
      if (!rect) rect = portrait.getBoundingClientRect();
      pct = Math.min(
        100,
        Math.max(0, ((e.clientX - rect.left) / rect.width) * 100),
      );
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          portrait.style.setProperty("--split", `${pct.toFixed(2)}%`);
        });
    };
    const leave = () => {
      rect = null;
      portrait.classList.remove("is-scrub");
      portrait.classList.add("is-release");
      portrait.style.setProperty("--split", "100%");
      timer = window.setTimeout(
        () => portrait.classList.remove("is-release"),
        800,
      );
    };
    portrait.addEventListener("pointerenter", enter);
    portrait.addEventListener("pointermove", move);
    portrait.addEventListener("pointerleave", leave);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      portrait.removeEventListener("pointerenter", enter);
      portrait.removeEventListener("pointermove", move);
      portrait.removeEventListener("pointerleave", leave);
    };
  }, []);

  // Scroll-out of the stage and the word-by-word summary, on the shared loop
  // with cached geometry: no layout reads while scrolling.
  useScrollFrame(
    (y, vh) => {
      const still = reducedMQ?.matches;
      const g = geo.current;
      const m = motionState.current;
      if (!still) {
        const p = clamp01((y - g.stageTop) / g.stageH);
        const q = clamp01((y - g.stageTop) / (g.stageH * 0.75));
        if (p !== m.p || q !== m.q) {
          m.p = p;
          m.q = q;
          apply();
        }
      }
      const summary = summaryRef.current;
      // Scroll-driven CSS lights the words where supported (About.css).
      if (summary && (!scrollDrivenWords || still)) {
        const from = vh * 0.88;
        const to = vh * 0.55 - g.sumH;
        const top = g.sumTop - y;
        const val = still
          ? 1
          : Math.round(clamp01((from - top) / (from - to)) * 400) / 400;
        if (val !== m.sum) {
          m.sum = val;
          summary.style.setProperty("--p", String(val));
        }
      }
    },
    () => {
      const g = geo.current;
      g.stageTop = docTop(stageRef.current);
      g.stageH = Math.max(1, stageRef.current?.offsetHeight ?? 1);
      g.sumTop = docTop(summaryRef.current);
      g.sumH = summaryRef.current?.offsetHeight ?? 1;
      const wide = window.matchMedia("(min-width: 761px)").matches;
      if (wide !== motionState.current.wide) {
        motionState.current.wide = wide;
        apply();
      }
    },
  );

  const letters = [...first].map((ch, i) => (
    <span key={i} data-l={i} style={{ "--c": i }}>
      {ch}
    </span>
  ));

  return (
    <section
      className="about"
      id="about"
      data-section="about"
      aria-labelledby="about-title"
    >
      <div className="stage" ref={stageRef}>
        <div className="vf" aria-hidden="true">
          <span className="vf__corner vf__corner--tl" />
          <span className="vf__corner vf__corner--tr" />
          <span className="vf__corner vf__corner--bl" />
          <span className="vf__corner vf__corner--br" />
          <span className="vf__third vf__third--v1" />
          <span className="vf__third vf__third--v2" />
          <span className="vf__third vf__third--h1" />
          <span className="vf__third vf__third--h2" />
        </div>

        <div className="hud label" aria-hidden="true">
          <span className="hud__rec">
            <span className="rec" />
            Rec{" "}
            <span className="hud__tc" ref={tcRef}>
              00:00:00:00
            </span>
          </span>
          <span className="hud__scene">
            Scene 01 <b>/</b> About
          </span>
        </div>

        <div className="glow" aria-hidden="true">
          <span className="glow__teal" />
          <span className="glow__red" />
          <span className="glow__amber" />
          <svg className="glow__orbit" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="190" />
            <circle cx="200" cy="200" r="150" />
          </svg>
        </div>

        <h1 className="sr-only" id="about-title">
          {profile.name}, {profile.role}
        </h1>

        <div className="name" aria-hidden="true">
          <div className="name__scroll" data-name-scroll="">
            <p className="name__word name__word--back">{letters}</p>
          </div>
        </div>

        <div className="subject">
          <div className="subject__scroll" ref={subjectRef}>
            <div
              className="portrait"
              data-grade=""
              data-cursor-label="Grade"
              ref={portraitRef}
            >
              <img
                src={p940}
                srcSet={srcSet}
                sizes={sizes}
                alt=""
                className="portrait__img portrait__img--log"
                width="940"
                height="1175"
                fetchPriority="high"
                decoding="async"
              />
              <div className="portrait__graded">
                <img
                  src={p940}
                  srcSet={srcSet}
                  sizes={sizes}
                  alt={`Portrait of ${profile.name}`}
                  className="portrait__img"
                  width="940"
                  height="1175"
                  decoding="async"
                />
              </div>
              {/* Corner labels, wiped by the same line as the image: each
                  one shows only on its own side of the split. */}
              <span className="portrait__tags" aria-hidden="true">
                <span className="portrait__tagside portrait__tagside--l">
                  <span className="label portrait__tag portrait__tag--l">
                    Graded
                  </span>
                </span>
                <span className="portrait__tagside portrait__tagside--r">
                  <span className="label portrait__tag portrait__tag--r">
                    Log
                  </span>
                </span>
              </span>
              <span className="portrait__split" aria-hidden="true" />
              <span className="track" aria-hidden="true">
                <span className="track__box" />
              </span>
            </div>
          </div>
        </div>

        <div className="name name--front" aria-hidden="true">
          <div className="name__scroll" data-name-scroll="">
            <p className="name__word name__word--front">{letters}</p>
          </div>
        </div>

        <div className="intro" ref={introRef}>
          <p className="label intro__kicker">
            <span className="intro__no">(01)</span>{" "}
            <Scramble text="The editor" />
          </p>
          <SplitText
            as="p"
            className="intro__name"
            text={restName}
            grad="cool"
            trigger="ready"
            delay={420}
            stagger={34}
          />
          <SplitText
            as="p"
            className="intro__role"
            text={profile.role}
            grad="warm"
            trigger="ready"
            delay={640}
            stagger={28}
          />
          <p className="intro__line">
            Editing, motion graphics, colour grading and sound design, cut for{" "}
            <WordRoll words={["Reels", "Shorts", "Stories", "Ads"]} />
          </p>
          <div className="intro__ctas">
            {hasWork && (
              <a className="pill pill--solid" href="#work" data-magnet="">
                View work
                <Icon name="arrow-right" size={16} />
              </a>
            )}
            <a className="pill" href="#contact" data-magnet="">
              <Icon name="mail" size={16} />
              Get in touch
            </a>
          </div>
        </div>

        <div className="scopes" aria-hidden="true" ref={scopesRef}>
          <div className="scope">
            <svg className="scope__svg" viewBox="0 0 120 120">
              <circle className="scope__ring" cx="60" cy="60" r="54" />
              <circle
                className="scope__ring scope__ring--in"
                cx="60"
                cy="60"
                r="36"
              />
              <circle
                className="scope__ring scope__ring--in"
                cx="60"
                cy="60"
                r="18"
              />
              <path className="scope__cross" d="M60 6v108M6 60h108" />
              <path
                className="scope__skin"
                d={`M60 60L${scope.skin.x} ${scope.skin.y}`}
              />
              {scope.targets.map((t) => (
                <Fragment key={t.l}>
                  <rect
                    className="scope__target"
                    x={t.x - 3}
                    y={t.y - 3}
                    width="6"
                    height="6"
                  />
                  <text className="scope__tl" x={t.lp.x} y={t.lp.y + 2}>
                    {t.l}
                  </text>
                </Fragment>
              ))}
              <g className="scope__trace">
                {scope.trace.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="1.1"
                    style={{ "--d": `${p.d}s` }}
                  />
                ))}
              </g>
            </svg>
            <p className="label scope__cap">Vectorscope</p>
          </div>
          <div className="meters">
            <div className="meter">
              <span style={{ "--dur": "0.9s" }} />
            </div>
            <div className="meter">
              <span style={{ "--dur": "1.15s", "--delay": "-0.4s" }} />
            </div>
            <p className="label meters__cap">A1 A2</p>
          </div>
        </div>

        {hasWork && (
          <a className="badge" href="#work">
            <span className="sr-only">Scroll to selected work</span>
            <svg
              className="badge__ring"
              viewBox="0 0 120 120"
              aria-hidden="true"
            >
              <defs>
                <path
                  id="badge-circle"
                  d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"
                />
              </defs>
              <text>
                <textPath href="#badge-circle" textLength="288">
                  {badgeText}
                </textPath>
              </text>
            </svg>
            <span className="badge__core">
              <Icon name="arrow-down" size={20} />
            </span>
          </a>
        )}
      </div>

      <div className="wrap profile">
        <Reveal as="p" fade className="label profile__label">
          <span className="intro__no">(01.1)</span> Profile
          <span className="profile__loc">
            <Icon name="pin" size={14} />
            {profile.location}
          </span>
        </Reveal>
        <p
          className="profile__summary"
          ref={summaryRef}
          style={{ "--n": tokens.length }}
        >
          {tokens.map((t, i) => (
            <Fragment key={i}>
              <span
                className={
                  t.tone ? `profile__word kw kw--${t.tone}` : "profile__word"
                }
                style={{ "--i": i }}
              >
                {t.text}
              </span>
              {t.tail && (
                <span className="profile__word" style={{ "--i": i }}>
                  {t.tail}
                </span>
              )}{" "}
            </Fragment>
          ))}
        </p>

        <dl className="stats">
          {stats.map((s, i) => (
            <Reveal className="stat" fade i={i} key={s.label}>
              <dt className="label stat__label">{s.label}</dt>
              <dd className="stat__value">
                <span className="sr-only">{s.value}</span>
                <span className="stat__digits" aria-hidden="true">
                  {[...s.value].map((d, k) => (
                    <span
                      className="stat__digit"
                      style={{ "--d": d, "--k": k + i }}
                      key={k}
                    >
                      <span>
                        {Array.from({ length: 10 }, (_, n) => (
                          <span key={n}>{n}</span>
                        ))}
                      </span>
                    </span>
                  ))}
                </span>
              </dd>
              <dd className="label stat__note">{s.note}</dd>
            </Reveal>
          ))}
        </dl>

        <ul className="langs" aria-label="Languages">
          {profile.languages.map((l, i) => (
            <Reveal as="li" className="lang" fade i={i} key={l.name}>
              <span className="lang__name">{l.name}</span>
              <span className="label">{l.level}</span>
              <span className="lang__bar" aria-hidden="true">
                <span
                  className={
                    l.level.startsWith("Native") ? "is-native" : undefined
                  }
                />
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
