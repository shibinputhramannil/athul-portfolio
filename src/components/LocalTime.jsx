import { useEffect, useState } from "react";

// The editor's local time (India), for clients planning a call.
const format = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});

/** Live IST clock, updated on the turn of each minute. */
export default function LocalTime({ className }) {
  const [now, setNow] = useState(() => format.format(new Date()));
  useEffect(() => {
    let id = 0;
    const tick = () => setNow(format.format(new Date()));
    const first = window.setTimeout(
      () => {
        tick();
        id = window.setInterval(tick, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return <time className={className}>{now}</time>;
}
