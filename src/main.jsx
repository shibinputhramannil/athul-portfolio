import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./styles/global.css";
import "./styles/parts/Intro.css";
import "./styles/parts/FloatingBg.css";
import "./styles/parts/Cursor.css";
import "./styles/parts/Header.css";
import "./styles/parts/SectionHead.css";
import "./styles/parts/About.css";
import "./styles/parts/Tapes.css";
import "./styles/parts/Craft.css";
import "./styles/parts/Toolkit.css";
import "./styles/parts/Experience.css";
import "./styles/parts/Contact.css";
import "./styles/parts/Footer.css";
import "./components/work/work.css";
import "./styles/glass.css";
import "./styles/kinetic.css";
import "./styles/color.css";
import "./styles/features.css";
import App from "./App";
import { watchHostBadge } from "./lib/hostBadge";

watchHostBadge();

// The first render runs as a transition, so React builds the page in small
// slices and yields to the browser between them instead of blocking the
// main thread in one long task (worst on mid-range phones).
const root = createRoot(document.getElementById("root"));
startTransition(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
