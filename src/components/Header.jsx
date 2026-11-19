import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { timecode } from "../lib/media";
import { useScrollFrame } from "../lib/ticker";
import { openPalette } from "./CommandPalette";

export default function Header({ nav, profile }) {
  const headerRef = useRef(null);
  const tcRef = useRef(null);
  const listRef = useRef(null);
  const [current, setCurrent] = useState("about");
  const [ind, setInd] = useState(null);
  const [mac, setMac] = useState(false);

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

  // Scrolled / hidden-on-scroll-down / progress / scroll timecode, on the
  // shared loop. Writes happen only when a value actually changes.
  const progressRef = useRef(null);
  const geo = useRef({ max: 1 });
  const st = useRef({ y: 0, scrolled: null, hidden: false, tc: "", p: -1 });
  useScrollFrame(
    (y) => {
      const header = headerRef.current;
      if (!header) return;
      const s = st.current;
      const delta = y - s.y;
      s.y = y;
      const scrolled = y > 12;
      if (scrolled !== s.scrolled) {
        header.classList.toggle("is-scrolled", scrolled);
        s.scrolled = scrolled;
      }
      let hidden = s.hidden;
      if (delta > 6 && y > 500 && !header.contains(document.activeElement))
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
      const tc = `TC ${timecode(y / 96)}`;
      if (tc !== s.tc && tcRef.current) {
        tcRef.current.textContent = tc;
        s.tc = tc;
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

  // Sliding pill under the current link.
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

  return (
    <>
      <header
        className="site-header"
        ref={headerRef}
        onFocus={() => headerRef.current?.classList.remove("is-hidden")}
      >
        <div className="wrap site-header__inner">
          <a className="brand" href="#about">
            <span className="sr-only">{profile.name}, back to start</span>
            <span className="brand__mark" aria-hidden="true">
              {initials}
              <span className="brand__rec" />
            </span>
            <span className="label brand__name" aria-hidden="true">
              {profile.name}
            </span>
          </a>
          <span
            className="label site-header__tc"
            aria-hidden="true"
            ref={tcRef}
          >
            TC 00:00:00:00
          </span>
          <nav className="site-nav" aria-label="Sections">
            <ul ref={listRef}>
              {nav.map((item) => (
                <li key={item.id}>
                  <a
                    className="label"
                    href={`#${item.id}`}
                    data-nav={item.id}
                    aria-current={current === item.id ? "true" : undefined}
                  >
                    <span>{item.label}</span>
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
          <button
            type="button"
            className="site-header__search"
            onClick={openPalette}
            // Starts with the visible words so voice control ("click
            // Search") and screen readers agree; the shortcut matches the OS.
            aria-label={`Search (${mac ? "⌘K" : "Ctrl K"})`}
          >
            <Icon name="search" size={16} />
            <span className="site-header__search-text">Search</span>
            <kbd>{mac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <a className="label site-header__cta" href="#contact" data-magnet="">
            <Icon name="mail" size={14} />
            Let&apos;s talk
          </a>
        </div>
        <span
          className="site-header__progress"
          aria-hidden="true"
          ref={progressRef}
        />
      </header>

      <nav className="dock" aria-label="Sections">
        <ul style={{ "--n": nav.length }}>
          {nav.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current === item.id ? "true" : undefined}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
