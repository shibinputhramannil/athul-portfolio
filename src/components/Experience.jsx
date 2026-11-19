import { Fragment, useEffect, useRef, useState } from "react";
import SectionHead from "./SectionHead";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { Scramble } from "./Kinetic";

/**
 * One role as an editorial row: dates, studio and role, then what the work
 * was. A hairline draws across the top and the studio name rises letter by
 * letter the first time the row comes into view.
 */
function Job({ job, i }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setActive(true);
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const [from, to] = job.period.split(/[–-]/);
  let c = 0;
  return (
    <li className={`xp__row${active ? " is-active" : ""}`} ref={ref}>
      <span className="xp__line" aria-hidden="true" />
      <div className="xp__when" data-xp-line="" style={{ "--l": 0 }}>
        <p className="xp__years">
          <span className="sr-only">{job.period}</span>
          <span aria-hidden="true">
            {from}
            {to && (
              <>
                <span className="xp__dash">–</span>
                {to}
              </>
            )}
          </span>
        </p>
        <span className={`label xp__badge${i === 0 ? " is-latest" : ""}`}>
          {i === 0 && <span className="xp__dot" aria-hidden="true" />}
          {i === 0 ? "Latest" : "Previous"}
        </span>
      </div>
      <div className="xp__who">
        <h3 className="xp__company">
          <span className="sr-only">{job.company}</span>
          <span aria-hidden="true">
            {job.company.split(" ").map((word, w) => (
              <Fragment key={w}>
                {w > 0 && " "}
                <span className="xp__word">
                  {[...word].map((ch, k) => (
                    <span className="xp__char" style={{ "--c": c++ }} key={k}>
                      {ch}
                    </span>
                  ))}
                </span>
              </Fragment>
            ))}
          </span>
        </h3>
        <p className="label xp__role" data-xp-line="" style={{ "--l": 1 }}>
          <Icon name="keyframe" size={10} />
          {job.role}
        </p>
      </div>
      <p className="xp__desc" data-xp-line="" style={{ "--l": 2 }}>
        {job.description}
      </p>
    </li>
  );
}

export default function Experience({ number, profile }) {
  const jobs = [...profile.experience].sort((a, b) =>
    b.period.localeCompare(a.period),
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

        <ol className="xp">
          {jobs.map((job, i) => (
            <Job job={job} i={i} key={job.company} />
          ))}
        </ol>

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
