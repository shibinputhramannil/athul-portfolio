import Reveal from "./Reveal";
import { SplitText } from "./Kinetic";

/**
 * The outlined echo behind a title. It is split into the same word and
 * letter boxes as the animated title in front, so both share one layout
 * (split letters lose the font's kerning) and the echo stays in register
 * with every letter instead of drifting out of line along the word.
 */
function Echo({ text }) {
  const words = text.split(" ");
  return (
    <span className="sh__echo" aria-hidden="true">
      <span className="sh__echo-in">
        {words.map((word, w) => (
          <span className="split__w" key={w}>
            {[...word].map((ch, k) => (
              <span className="sh__echo-c" key={k}>
                {ch}
              </span>
            ))}
            {w < words.length - 1 && <span className="split__sp"> </span>}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Scene slate: a clapperboard that snaps shut as the section arrives, then
 * the title rising letter by letter over an outlined echo, with a cut wipe.
 */
export default function SectionHead({ number, title, id, kicker }) {
  return (
    <Reveal as="header" className="sh">
      <div className="sh__top">
        <div className="sh__slate" aria-hidden="true">
          <span className="sh__clap" />
          <span className="sh__board">
            <span className="label">Scene</span>
            <b>{number}</b>
          </span>
        </div>
        {kicker && <p className="sh__kicker">{kicker}</p>}
      </div>
      <h2 className="sh__title" id={id}>
        <Echo text={title} />
        <SplitText text={title} hover grad="sec" stagger={30} />
        <span className="sh__cut" aria-hidden="true" />
      </h2>
      <div className="sh__rule" aria-hidden="true">
        <span className="sh__head" />
      </div>
    </Reveal>
  );
}
