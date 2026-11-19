import { Fragment, useEffect, useRef, useState } from "react";
import SectionHead from "./SectionHead";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { Scramble } from "./Kinetic";
import { docTop, useScrollFrame } from "../lib/ticker";

const clamp01 = (v) => Math.min(1, Math.max(0, v));

function Job({ job, i, total }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  let c = 0;
  return (
    <li
      className={`tl__item${active ? " is-active" : ""}`}
      ref={ref}
      data-tl-item=""
    >
      <span className="tl__node" aria-hidden="true" />
      <p className="tl__years" aria-hidden="true">
        {job.period.replace("–", "—")}
      </p>
      <div className="tl__body">
        <span className="tl__trim tl__trim--l" aria-hidden="true" />
        <span className="tl__trim tl__trim--r" aria-hidden="true" />
        <p className="label tl__meta" data-tl-line="" style={{ "--l": 0 }}>
          <span className="tl__no">V{total - i}</span>
          <span>{job.period}</span>
          <span className="tl__badge">{i === 0 ? "Latest" : "Previous"}</span>
        </p>
        <h3 className="tl__company">
          <span className="sr-only">{job.company}</span>
          <span className="tl__kinetic" aria-hidden="true">
            {job.company.split(" ").map((word, w) => (
              <Fragment key={w}>
                {w > 0 && " "}
                <span className="tl__word">
                  {[...word].map((ch, k) => (
                    <span className="tl__char" style={{ "--c": c++ }} key={k}>
                      {ch}
                    </span>
                  ))}
                </span>
              </Fragment>
            ))}
          </span>
        </h3>
        <p className="label tl__role" data-tl-line="" style={{ "--l": 1 }}>
          <Icon name="keyframe" size={10} />
          {job.role}
        </p>
        <p className="tl__desc" data-tl-line="" style={{ "--l": 2 }}>
          {job.description}
        </p>
      </div>
    </li>
  );
}

export default function Experience({ number, profile }) {
  const listRef = useRef(null);
  const fillRef = useRef(null);
  const jobs = [...profile.experience].sort((a, b) =>
    b.period.localeCompare(a.period),
  );

  // The track fills as the list scrolls through the frame; years drift
  // sideways. Geometry is cached, so scrolling only writes transforms.
  const geo = useRef({ top: 0, h: 1, items: [] });
  const last = useRef({ p: -1 });
  useScrollFrame(
    (y, vh) => {
      const g = geo.current;
      // Skip all work while the list is far from the viewport.
      if (y + vh < g.top - 200 || y > g.top + g.h + 200) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (fillRef.current) fillRef.current.style.transform = "none";
        return;
      }
      const from = vh * 0.75;
      const to = vh * 0.6 - g.h;
      const p =
        Math.round(clamp01((from - (g.top - y)) / (from - to)) * 1000) / 1000;
      if (p !== last.current.p && fillRef.current) {
        fillRef.current.style.transform = `scaleY(${p})`;
        last.current.p = p;
      }
      g.items.forEach(({ el, top, h }) => {
        const q = clamp01((vh - (top - y)) / (vh + h));
        el.style.transform = `translate3d(${(4 - q * 8).toFixed(2)}%, 0, 0)`;
      });
    },
    () => {
      const list = listRef.current;
      if (!list) return;
      geo.current = {
        top: docTop(list),
        h: list.offsetHeight,
        items: Array.from(list.querySelectorAll(".tl__item"))
          .map((item) => ({
            el: item.querySelector(".tl__years"),
            top: docTop(item),
            h: item.offsetHeight,
          }))
          .filter((i) => i.el),
      };
    },
  );

  return (
    <section
      className="section"
      data-section="experience"
      aria-labelledby="experience"
    >
      <div className="wrap">
        <SectionHead
          number={number}
          title="Experience"
          id="experience"
          kicker="Two studios, back to back. Newest cut on top."
        />

        <div className="tl tl--animate">
          <div className="tl__track" aria-hidden="true">
            <span className="tl__fill" ref={fillRef} />
          </div>
          <ol className="tl__list" ref={listRef}>
            {jobs.map((job, i) => (
              <Job job={job} i={i} total={jobs.length} key={job.company} />
            ))}
          </ol>
        </div>

        <div className="edu">
          <Reveal as="h3" fade className="label edu__title">
            <span className="edu__no">({number}.1)</span>{" "}
            <Scramble text="Education" />
          </Reveal>
          <ul className="edu__list">
            {profile.education.map((e, i) => (
              <Reveal
                as="li"
                className="edu__item"
                fade
                i={i}
                key={e.qualification}
              >
                <span className="label edu__period">{e.period}</span>
                <span className="edu__q">{e.qualification}</span>
                <span className="edu__inst">{e.institution}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
