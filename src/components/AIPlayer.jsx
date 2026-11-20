import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { preloadScenes } from "./toolPrograms";

/** Every topic is one 10 s scene; a programme plays them back to back. */
export const SCENE_MS = 10_000;
const two = (n) => String(n).padStart(2, "0");
const clock = (ms) => `${Math.floor(ms / 60000)}:${two((ms / 1000) % 60)}`;

/** Shown in the shot while a topic's scene is still loading. */
function SceneLoading() {
  return (
    <svg className="ai ai--wait" viewBox="0 0 480 270">
      <rect
        className="ai-frame"
        x="16"
        y="16"
        width="324"
        height="182"
        rx="6"
      />
      <rect
        className="ai-phone"
        x="352"
        y="16"
        width="114"
        height="182"
        rx="10"
      />
      <rect className="ai-shimmer" x="16" y="16" width="120" height="182" />
      <text className="ai-wait" x="178" y="111" textAnchor="middle">
        Loading scene…
      </text>
    </svg>
  );
}

/** Tells the player when a scene that loaded late has mounted. */
function Mounted({ onReady, children }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => onReady?.(), []);
  return children;
}

/**
 * One topic as a frame of the video: its scene, plus the title card that
 * opens it (and covers its reset), the narration and the result badge.
 * All of it runs on the scene's own 10 s loop (see Toolkit.css).
 */
export function SceneFrame({ topic, k, total, onReady }) {
  const { Scene } = topic;
  return (
    <>
      <Suspense fallback={<SceneLoading />}>
        <Mounted onReady={onReady}>
          <Scene />
        </Mounted>
      </Suspense>

      <div className="aip__intro">
        <span className="aip__chip">
          <span className="aip__dot" />
          Topic {two(k + 1)} / {two(total)}
          <span className={`aip__kind${topic.kind === "AI" ? " is-ai" : ""}`}>
            {topic.kind}
          </span>
        </span>
        <span className="aip__title">{topic.title}</span>
        <span className="aip__algo">{topic.algo}</span>
        <span className="aip__engine">
          <Icon name="spark" size={11} />
          {topic.engine}
        </span>
      </div>

      <span className="aip__result">
        <Icon name="check" size={12} />
        {topic.result}
        <i className="aip__spark aip__spark--1" />
        <i className="aip__spark aip__spark--2" />
        <i className="aip__spark aip__spark--3" />
        <i className="aip__spark aip__spark--4" />
      </span>

      <p className="aip__captions">
        {topic.captions.map((line, c) => (
          <span className={`aip__cap aip__cap--${c + 1}`} key={line}>
            {line.split(" ").map((w, j) => (
              <span className="aip__w" style={{ "--k": j }} key={j}>
                {w}{" "}
              </span>
            ))}
          </span>
        ))}
      </p>
    </>
  );
}

/**
 * A tool's explainer, played like a short AI course video that runs on its
 * own: five topics of 10 s each. Under the video, a five-segment progress
 * bar (click a segment to jump) and the AI pipeline of the topic playing:
 * the engine that runs it and its three steps lighting up in turn. Beside
 * it, the topic playlist with the one playing open and filling.
 *
 * The programme clock is the progress bar's own 50 s CSS animation, so
 * scrolling the card away stops everything at once. Only the playing scene
 * is mounted; when the clock crosses into the next topic its scene mounts
 * and is lined up with the clock. Seeking moves every loop in the card to
 * the same point.
 */
export default function AIPlayer({ product, head, topics }) {
  const n = topics.length;
  const total = n * SCENE_MS;
  const [scene, setScene] = useState(0);
  // The animated video only mounts once the card nears the screen, so the
  // page's first render stays light.
  const [near, setNear] = useState(false);
  const stageRef = useRef(null);
  const fillRef = useRef(null);
  const animRef = useRef(null);

  const card = () => stageRef.current?.closest(".tool");
  const now = () => {
    let a = animRef.current;
    if (!a || a.playState === "idle") {
      a = animRef.current = fillRef.current?.getAnimations()[0] ?? null;
    }
    const t = a?.currentTime;
    if (t == null) return null;
    const v = Number(t);
    // Wrapped into [0, total): a just-started animation can briefly report
    // an odd time, and that must never pick a topic that doesn't exist.
    return Number.isFinite(v) ? ((v % total) + total) % total : null;
  };
  const sceneAt = (t) => Math.min(n - 1, Math.max(0, Math.floor(t / SCENE_MS)));
  // Line up every loop in the card (programme and scene) with time t, as
  // if it had played from the start: an animation's own delay still
  // applies, so staggers (word by word, tile by tile) survive a seek.
  const align = (t) => {
    card()
      ?.getAnimations({ subtree: true })
      .forEach((a) => {
        const tm = a.effect?.getTiming?.();
        if (!tm) return;
        if (tm.duration === total) a.currentTime = t;
        else if (tm.duration === SCENE_MS) a.currentTime = t % SCENE_MS;
      });
  };
  const seek = (t) => {
    align(t);
    setScene(sceneAt(t));
  };
  const go = (k) => seek(((k + n) % n) * SCENE_MS + 1);
  const onScrub = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(0.9999, Math.max(0, (e.clientX - r.left) / r.width));
    seek(f * total);
  };

  // A scene starts its animations when it mounts: line them up (again when
  // a scene that was still loading arrives).
  const realign = () => {
    const t = now();
    if (t != null) align(t);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(realign, [scene]);

  // Each card plays only while it is on screen (so every explainer starts
  // from its first topic when you reach it) and follows the clock into the
  // next topic.
  useEffect(() => {
    const el = card();
    if (!el || !("IntersectionObserver" in window)) return;
    let raf = 0;
    const tick = () => {
      const t = now();
      if (t != null) setScene(sceneAt(t));
      raf = requestAnimationFrame(tick);
    };
    el.setAttribute("data-away", "");
    // Near the screen: mount the video and fetch the other topics' scenes
    // well before they are needed.
    const early = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        preloadScenes();
        setNear(true);
        // Lets the card's own scroll motion attach (see Toolkit.css).
        el.setAttribute("data-near", "");
        early.disconnect();
      },
      { rootMargin: "2400px 0px" },
    );
    early.observe(el);
    // "On screen" means most of the card, or half the screen on short ones.
    const io = new IntersectionObserver(
      ([e]) => {
        const seen =
          e.isIntersecting &&
          e.intersectionRect.height >=
            Math.min(e.boundingClientRect.height * 0.6, innerHeight * 0.5);
        el.toggleAttribute("data-away", !seen);
        cancelAnimationFrame(raf);
        raf = seen ? requestAnimationFrame(tick) : 0;
      },
      { threshold: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      early.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topic = topics[scene] ?? topics[0];
  return (
    <>
      <div className="tool__stage" ref={stageRef}>
        <div className="aip">
          <div className="aip__video" aria-hidden="true">
            <div className="aip__scene" key={scene}>
              {near && (
                <SceneFrame
                  topic={topic}
                  k={scene}
                  total={n}
                  onReady={realign}
                />
              )}
            </div>
          </div>

          <div className="aip__bar">
            <div className="aip__track" onClick={onScrub} aria-hidden="true">
              <span className="aip__rail" />
              <span className="aip__fill" ref={fillRef} />
              <span className="aip__head" />
            </div>
            <div className="aip__ai">
              <span className="aip__live">
                <i />
                AI
              </span>
              <span className="aip__engine-now">{topic.engine}</span>
              <ol
                className="aip__beats"
                key={scene}
                aria-label={`${topic.title}: ${topic.beats.join(", ")}`}
              >
                {topic.beats.map((b, k) => (
                  <li className={`aip__beat aip__beat--${k + 1}`} key={b}>
                    <span className="aip__beat-n" aria-hidden="true">
                      <b>{k + 1}</b>
                      <Icon name="check" size={9} />
                    </span>
                    {b}
                  </li>
                ))}
              </ol>
              <span className="aip__time" aria-hidden="true">
                <span className="aip__now" /> / {clock(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool__info">
        {head}
        <div className="tp">
          <p className="tp__head">
            <span>{n} topics</span>
            <span>{clock(total)}</span>
          </p>
          <ol className="tp__list">
            {topics.map((t, k) => (
              <li
                key={t.title}
                className={`tp__item${k === scene ? " is-on" : ""}${k < scene ? " is-done" : ""}`}
              >
                <button
                  type="button"
                  className="tp__btn"
                  onClick={() => go(k)}
                  aria-current={k === scene ? "true" : undefined}
                >
                  <span className="tp__n" aria-hidden="true">
                    <span className="tp__num">{two(k + 1)}</span>
                    <span className="tp__eq">
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                  <span className="tp__main">
                    <span className="tp__t">
                      {t.title}
                      <span
                        className={`tp__kind${t.kind === "AI" ? " is-ai" : ""}`}
                      >
                        {t.kind}
                      </span>
                    </span>
                    <span className="tp__more">
                      <span className="tp__desc">
                        {t.desc} <em>{t.algo}.</em>
                      </span>
                    </span>
                  </span>
                  <span className="tp__dur" aria-hidden="true">
                    {clock(SCENE_MS)}
                  </span>
                  <span className="tp__bar" aria-hidden="true">
                    <i />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
