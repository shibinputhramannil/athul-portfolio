import SectionHead from "../SectionHead";
import ReelRing from "./ReelRing";
import Bin from "./Bin";
import { duration, useTones } from "../../lib/media";
import { useInView } from "../../hooks/useInView";

const NONE = [];

export default function Work({ number, videos, onOpen, suspended }) {
  // Sample each edit's colour signature only once the section is close.
  const [ref, near] = useInView({ rootMargin: "900px 0px", threshold: 0 });
  const tones = useTones(near ? videos : NONE);
  const runtime = duration(
    videos.reduce((a, v) => a + (v.durationSec ?? 0), 0),
  );

  return (
    <section
      className="section wk"
      ref={ref}
      data-section="work"
      aria-labelledby="work"
    >
      <div className="wrap">
        <SectionHead
          number={number}
          title="Selected work"
          id="work"
          kicker={`${videos.length} vertical edits, ${runtime} of footage. Drag the reel, or skim the bin.`}
        />
      </div>
      <ReelRing
        videos={videos}
        tones={tones}
        onOpen={onOpen}
        suspended={suspended}
      />
      <div className="wrap">
        <Bin videos={videos} tones={tones} onOpen={onOpen} />
      </div>
    </section>
  );
}
