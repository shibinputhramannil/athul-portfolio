import { useEffect, useState } from "react";
import Icon from "./Icon";

// The editor's local time (India), for clients planning a call.
const clockFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});

function LocalTime() {
  const [now, setNow] = useState(() => clockFormat.format(new Date()));
  useEffect(() => {
    const tick = () => setNow(clockFormat.format(new Date()));
    // Line up with the turn of the minute, then update once a minute.
    const first = window.setTimeout(
      () => {
        tick();
        id = window.setInterval(tick, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    let id = 0;
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return (
    <p className="credits__clock">
      <time>{now}</time> <span className="label">IST · UTC+5:30</span>
    </p>
  );
}

/**
 * Closing credits: a large wordmark and a call to action, then where to go,
 * how to reach the editor and his local time, and the copyright line.
 */
export default function Footer({ profile, nav }) {
  const year = new Date().getFullYear();
  return (
    <footer className="credits">
      <div className="wrap credits__main">
        <div className="credits__head">
          <p className="credits__mark">
            <span className="credits__name">{profile.name}</span>
            <em className="credits__role">{profile.role}</em>
          </p>
          <a className="pill pill--solid credits__cta" href="#contact">
            Start a project
            <Icon name="arrow-right" size={16} />
          </a>
        </div>

        <div className="credits__cols">
          <nav className="credits__col" aria-label="Footer">
            <p className="label credits__label">Navigate</p>
            <ul className="credits__links">
              {nav.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="credits__col">
            <p className="label credits__label">Contact</p>
            <a className="credits__email" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <p className="credits__place">{profile.location}</p>
          </div>
          <div className="credits__col">
            <p className="label credits__label">Local time</p>
            <LocalTime />
          </div>
        </div>
      </div>

      <div className="wrap credits__bar">
        <span className="label">
          © {year} {profile.name}
        </span>
        <a className="label credits__top" href="#about">
          <Icon name="rewind" size={14} />
          Back to top
        </a>
      </div>
    </footer>
  );
}
