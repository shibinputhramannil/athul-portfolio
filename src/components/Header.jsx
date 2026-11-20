import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon from "./Icon";
import LocalTime from "./LocalTime";
import { useScrollFrame } from "../lib/ticker";
import { lockScroll, scrollToEl } from "../lib/scroll";
import { openPalette } from "./CommandPalette";

const sectionEl = (id) =>
  document.querySelector(`[data-section="${id}"]`) ||
  document.getElementById(id);

/**
 * Site header. Flat over the first screen; once the page scrolls it
 * condenses into a floating glass bar with a reading-progress line, hides
 * while scrolling down and returns on the way up. On phones the links move
 * into a full-screen menu.
 */
export default function Header({ nav, profile }) {
  const headerRef = useRef(null);
  const listRef = useRef(null);
  const menuBtnRef = useRef(null);
  const firstLinkRef = useRef(null);
  const [current, setCurrent] = useState("about");
  const [ind, setInd] = useState(null);
  const [mac, setMac] = useState(false);
  const [open, setOpen] = useState(false);

  // The page's accent colours follow the scene in view.
  useEffect(() => {
    document.documentElement.dataset.scene = current;
  }, [current]);
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  const initials = profile.name
    .split(" ")
    .filter((w) => w.length > 1)
    .map((w) => w[0])
    .join("");

  // Condensed / hidden-on-scroll-down / progress, on the shared scroll loop.
  // Writes happen only when a value actually changes.
  const progressRef = useRef(null);
  const geo = useRef({ max: 1 });
  const st = useRef({ y: 0, scrolled: null, hidden: false, p: -1 });
  useScrollFrame(
    (y) => {
      const header = headerRef.current;
      if (!header) return;
      const s = st.current;
      const delta = y - s.y;
      s.y = y;
      const scrolled = y > 24;
      if (scrolled !== s.scrolled) {
        header.classList.toggle("is-scrolled", scrolled);
        s.scrolled = scrolled;
      }
      let hidden = s.hidden;
      if (delta > 6 && y > 520 && !header.contains(document.activeElement))
        hidden = true;
      else if (delta < -6 || y < 200) hidden = false;
      if (hidden !== s.hidden) {
        header.classList.toggle("is-hidden", hidden);
        s.hidden = hidden;
      }
      const p = Math.round(Math.min(1, y / geo.current.max) * 1000) / 1000;
      if (p !== s.p && progressRef.current) {
        progressRef.current.style.transform = `scaleX(${p})`;
        s.p = p;
      }
    },
    () => {
      geo.current.max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    },
  );

  // Scroll spy over every [data-section].
  useEffect(() => {
    const ids = new Set(nav.map((n) => n.id));
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.dataset.section;
          if (entry.isIntersecting && ids.has(id)) setCurrent(id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    document
      .querySelectorAll("[data-section]")
      .forEach((section) => spy.observe(section));
    return () => spy.disconnect();
  }, [nav]);

  // Highlight that slides to the current link.
  useLayoutEffect(() => {
    const place = () => {
      const link = listRef.current?.querySelector(`[data-nav="${current}"]`);
      if (link) setInd({ x: link.offsetLeft, w: link.offsetWidth });
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [current, nav]);

  // Phone menu: locks the page, closes on Esc, and hands focus in and back.
  useEffect(() => {
    if (!open) return;
    const btn = menuBtnRef.current;
    lockScroll(true);
    headerRef.current?.classList.remove("is-hidden");
    st.current.hidden = false;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const raf = requestAnimationFrame(() => firstLinkRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
      btn?.focus({ preventScroll: true });
    };
  }, [open]);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 921px)");
    const onChange = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  // Close the menu first, then travel, so the page is unlocked to scroll.
  const goFromMenu = (e, id) => {
    e.preventDefault();
    setOpen(false);
    window.setTimeout(() => scrollToEl(sectionEl(id)), 80);
  };

  return (
    <>
      <header
        className={`site-header${open ? " is-menu" : ""}`}
        ref={headerRef}
        onFocus={() => headerRef.current?.classList.remove("is-hidden")}
      >
        <div className="wrap">
          <div className="site-header__bar">
            <a className="brand" href="#about">
              <span className="sr-only">{profile.name}, back to start</span>
              <span className="brand__mark" aria-hidden="true">
                {initials}
              </span>
              <span className="brand__text" aria-hidden="true">
                <span className="brand__name">{profile.name}</span>
                <span className="brand__role">{profile.role}</span>
              </span>
            </a>

            <nav className="site-nav" aria-label="Sections">
              <ul ref={listRef}>
                {nav.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      data-nav={item.id}
                      aria-current={current === item.id ? "true" : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <span
                className={`site-nav__ind${ind ? " is-on" : ""}`}
                aria-hidden="true"
                style={
                  ind ? { "--x": `${ind.x}px`, "--w": `${ind.w}px` } : undefined
                }
              />
            </nav>

            <div className="site-header__actions">
              <button
                type="button"
                className="site-header__search"
                onClick={openPalette}
                aria-label={`Search ${mac ? "⌘K" : "Ctrl K"}`}
              >
                <Icon name="search" size={16} />
                <span className="site-header__search-text">Search</span>{" "}
                <kbd>{mac ? "⌘K" : "Ctrl K"}</kbd>
              </button>
              <a className="site-header__cta" href="#contact" data-magnet="">
                Let&apos;s talk
                <Icon name="arrow-right" size={15} />
              </a>
              <button
                type="button"
                className="site-header__menu"
                ref={menuBtnRef}
                aria-expanded={open}
                aria-controls="site-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((o) => !o)}
              >
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </button>
            </div>

            <span
              className="site-header__progress"
              aria-hidden="true"
              ref={progressRef}
            />
          </div>
        </div>
      </header>

      {/* Outside the header: its blur and transform would trap a fixed panel. */}
      <div
        className={`menu${open ? " is-open" : ""}`}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
      >
        <nav className="menu__nav" aria-label="Sections">
          <ol className="menu__list">
            {nav.map((item, i) => (
              <li key={item.id} style={{ "--i": i }}>
                <a
                  className="menu__link"
                  href={`#${item.id}`}
                  ref={i === 0 ? firstLinkRef : undefined}
                  aria-current={current === item.id ? "true" : undefined}
                  onClick={(e) => goFromMenu(e, item.id)}
                >
                  <span className="menu__no" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="menu__label">{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="menu__foot" style={{ "--i": nav.length }}>
          <a className="menu__email" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <p className="menu__meta">
            {profile.location.split(",")[0]} · <LocalTime /> IST
          </p>
          <a
            className="site-header__cta menu__cta"
            href="#contact"
            onClick={(e) => goFromMenu(e, "contact")}
          >
            Let&apos;s talk
            <Icon name="arrow-right" size={15} />
          </a>
        </div>
      </div>
    </>
  );
}
