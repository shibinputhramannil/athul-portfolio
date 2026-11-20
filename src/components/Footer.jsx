import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import LocalTime from "./LocalTime";
import { toast } from "../lib/toast";

/**
 * The giant first name the page ends on: near-black on black and cut off by
 * the bottom of the page, like a watermark. Its letters rise in once it
 * comes into view; on desktop a soft spotlight follows the pointer and
 * shows the colour grade inside the letters.
 */
function Wordmark({ word }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!el || !fine.matches || still.matches) return;
    let rect = null;
    let raf = 0;
    let x = 0;
    let y = 0;
    const write = () => {
      raf = 0;
      el.style.setProperty("--mx", `${x.toFixed(0)}px`);
      el.style.setProperty("--my", `${y.toFixed(0)}px`);
    };
    const move = (e) => {
      rect ??= el.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(write);
    };
    const enter = () => {
      rect = el.getBoundingClientRect();
      el.classList.add("is-lit");
    };
    const leave = () => el.classList.remove("is-lit");
    const forget = () => (rect = null);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", forget, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", forget);
    };
  }, []);

  const letters = [...word.toUpperCase()];
  const row = (cls) => (
    <p className={`wordmark__row ${cls}`} style={{ "--n": letters.length }}>
      {letters.map((ch, i) => (
        <span key={i} style={{ "--i": i }}>
          {ch}
        </span>
      ))}
    </p>
  );
  return (
    <div
      className={`wordmark${inView ? " is-in" : ""}`}
      ref={ref}
      aria-hidden="true"
    >
      {row("wordmark__base")}
      {row("wordmark__lit")}
    </div>
  );
}

/**
 * Site footer: who and where, the sections, services and contact, the
 * legal line, then the shadow wordmark the page ends on.
 */
export default function Footer({ profile, nav }) {
  const year = new Date().getFullYear();
  const [first] = profile.name.split(" ");
  const place = profile.location.split(",")[0];
  const services = profile.skills.slice(0, 5);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      toast("Email copied");
    } catch {
      toast(profile.email);
    }
  }

  return (
    <footer className="credits">
      <div className="wrap credits__main">
        <div className="credits__brand">
          <p className="credits__name">
            {profile.name}
            <em>{profile.role}</em>
          </p>
          <p className="credits__blurb">
            Short-form edits built on storytelling and finished with visual
            effects, colour grading and sound design. Based in {place}, India.
          </p>
          <p className="credits__time">
            <span className="credits__pulse" aria-hidden="true" />
            <LocalTime /> in {place} <span>(IST, UTC+5:30)</span>
          </p>
        </div>

        <nav className="credits__col credits__col--nav" aria-label="Footer">
          <h2 className="credits__head">Navigate</h2>
          <ul className="credits__links">
            {nav.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="credits__col credits__col--services">
          <h2 className="credits__head">Services</h2>
          <ul className="credits__list">
            {services.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="credits__col credits__col--contact">
          <h2 className="credits__head">Contact</h2>
          <ul className="credits__links">
            <li>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            <li>
              <button
                type="button"
                className="credits__copy"
                onClick={copyEmail}
              >
                <Icon name="copy" size={14} />
                Copy email
              </button>
            </li>
            <li>
              <a href="#contact">Send a brief</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="wrap credits__bar">
        <p className="credits__legal">
          © {year} {profile.name}. All rights reserved.
        </p>
        <a className="credits__top" href="#about">
          Back to top
          <span className="credits__top-icon" aria-hidden="true">
            <Icon name="arrow-up" size={15} />
          </span>
        </a>
      </div>

      <Wordmark word={first} />
    </footer>
  );
}
