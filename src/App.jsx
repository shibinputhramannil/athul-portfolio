import { useCallback, useEffect, useState } from "react";
import { usePortfolioData } from "./lib/data";
import { useMagnet } from "./hooks/useMagnet";
import FloatingBg from "./components/FloatingBg";
import Cursor from "./components/Cursor";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Tapes from "./components/Tapes";
import Work from "./components/work/Work";
import Viewer from "./components/work/Viewer";
import Craft from "./components/Craft";
import Experience from "./components/Experience";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import CommandPalette from "./components/CommandPalette";
import Toaster from "./components/Toaster";

export default function App() {
  const { profile, videos } = usePortfolioData();
  const [viewing, setViewing] = useState(null); // index into videos

  // Tell the opener (index.html) the page is on screen, so it can reframe
  // onto the hero instead of onto an empty page.
  useEffect(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event("ak:ready")));
  }, []);
  useMagnet();

  const hasWork = videos.length > 0;
  const nav = [
    { id: "about", label: "About", icon: "about" },
    hasWork && { id: "work", label: "Work", icon: "work" },
    { id: "craft", label: "Craft", icon: "craft" },
    { id: "experience", label: "Experience", icon: "experience" },
    { id: "contact", label: "Contact", icon: "contact" },
  ].filter(Boolean);
  // Scene numbers follow page order.
  const order = nav.map((s) => s.id);
  const scene = (id) => String(order.indexOf(id) + 1).padStart(2, "0");

  const openViewer = useCallback((i) => setViewing(i), []);
  const closeViewer = useCallback(() => setViewing(null), []);

  return (
    <>
      <FloatingBg />
      <Cursor />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header nav={nav} profile={profile} />
      <main id="main">
        <Hero profile={profile} editCount={videos.length} />
        <Tapes skills={profile.skills} />
        {hasWork && (
          <Work
            number={scene("work")}
            videos={videos}
            onOpen={openViewer}
            suspended={viewing != null}
          />
        )}
        <Craft number={scene("craft")} profile={profile} />
        <Experience number={scene("experience")} profile={profile} />
        <Contact number={scene("contact")} profile={profile} />
      </main>
      <Footer profile={profile} nav={nav} />
      <CommandPalette
        nav={nav}
        videos={videos}
        profile={profile}
        onOpenVideo={openViewer}
      />
      <Toaster />
      {hasWork && (
        <Viewer
          videos={videos}
          index={viewing}
          onIndex={setViewing}
          onClose={closeViewer}
        />
      )}
    </>
  );
}
