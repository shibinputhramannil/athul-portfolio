import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { labelOf } from "../lib/data";
import { duration } from "../lib/media";
import { lockScroll, scrollToEl } from "../lib/scroll";
import { toast } from "../lib/toast";

/** Opens the palette from anywhere (header button, shortcuts). */
export const openPalette = () =>
  window.dispatchEvent(new Event("palette:open"));

/** Subsequence match with a simple score: prefix > word start > contains > fuzzy. */
function score(text, q) {
  if (!q) return 1;
  const t = text.toLowerCase();
  if (t.startsWith(q)) return 4;
  if (t.split(/\s+/).some((w) => w.startsWith(q))) return 3;
  if (t.includes(q)) return 2;
  let i = 0;
  for (const ch of t) if (ch === q[i]) i++;
  return i === q.length ? 1 : 0;
}

/**
 * Command palette (Ctrl/⌘ K or "/"): jump to a scene, play any edit, copy
 * the email, write an email or share the portfolio, all from the keyboard.
 */
export default function CommandPalette({ nav, videos, profile, onOpenVideo }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const returnTo = useRef(null);

  const commands = useMemo(() => {
    const go = nav.map((s, i) => ({
      id: `go-${s.id}`,
      group: "Go to",
      icon: s.icon,
      label: s.label,
      hint: `Scene ${String(i + 1).padStart(2, "0")}`,
      run: () =>
        scrollToEl(
          document.querySelector(`[data-section="${s.id}"]`) ||
            document.getElementById(s.id),
        ),
    }));
    const watch = videos.map((v, i) => ({
      id: `watch-${v.id}`,
      group: "Watch",
      icon: "play",
      label: `Watch ${labelOf(v)}`,
      hint: duration(v.durationSec) ?? "",
      run: () => onOpenVideo(i),
    }));
    const actions = [
      {
        id: "copy",
        group: "Actions",
        icon: "copy",
        label: "Copy email address",
        hint: profile.email,
        run: async () => {
          try {
            await navigator.clipboard.writeText(profile.email);
            toast("Email copied");
          } catch {
            toast(profile.email);
          }
        },
      },
      {
        id: "mail",
        group: "Actions",
        icon: "mail",
        label: `Email ${profile.name.split(" ")[0]}`,
        hint: "Opens your mail app",
        run: () => (window.location.href = `mailto:${profile.email}`),
      },
      {
        id: "share",
        group: "Actions",
        icon: "share",
        label: "Share this portfolio",
        hint: "Link",
        run: async () => {
          const data = {
            title: document.title,
            url: window.location.href.split("#")[0],
          };
          if (navigator.share) {
            try {
              await navigator.share(data);
              return;
            } catch {
              /* cancelled: fall back to copying */
            }
          }
          try {
            await navigator.clipboard.writeText(data.url);
            toast("Link copied");
          } catch {
            toast(data.url);
          }
        },
      },
      {
        id: "top",
        group: "Actions",
        icon: "arrow-up",
        label: "Back to top",
        hint: "",
        run: () => scrollToEl(document.getElementById("about")),
      },
    ];
    return [...go, ...watch, ...actions];
  }, [nav, videos, profile, onOpenVideo]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return commands
      .map((c) => ({
        c,
        s: Math.max(score(c.label, q), score(c.group, q) && q ? 1 : 0),
      }))
      .filter((r) => r.s > 0)
      .sort((a, b) => (q ? b.s - a.s : 0))
      .map((r) => r.c);
  }, [commands, query]);

  const close = useCallback(() => setOpen(false), []);

  // Shortcuts and the open event.
  useEffect(() => {
    const onKey = (e) => {
      const typing = e.target.closest?.("input, textarea, [contenteditable]");
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("palette:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("palette:open", onOpen);
    };
  }, [open]);

  // Focus in on open, back out on close; the page stays still meanwhile.
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    setQuery("");
    setSel(0);
    lockScroll(true);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      lockScroll(false);
      returnTo.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => setSel(0), [query]);

  // Keep the selected row in view inside the list.
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${sel}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const run = (cmd) => {
    if (!cmd) return;
    close();
    // Let the palette release the page before acting on it.
    window.setTimeout(() => cmd.run(), 60);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(results.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[sel]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      e.preventDefault();
    }
  };

  let lastGroup = null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmdk"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            className="cmdk__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="cmdk__search">
              <Icon name="search" size={18} />
              <input
                ref={inputRef}
                className="cmdk__input"
                placeholder="Search scenes, edits and actions…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-expanded="true"
                aria-controls="cmdk-list"
                aria-activedescendant={
                  results[sel] ? `cmdk-${results[sel].id}` : undefined
                }
                aria-autocomplete="list"
                spellCheck="false"
              />
              <kbd className="cmdk__esc">Esc</kbd>
            </div>
            <ul
              className="cmdk__list"
              id="cmdk-list"
              role="listbox"
              ref={listRef}
            >
              {results.length === 0 && (
                <li className="cmdk__empty">Nothing matches “{query}”.</li>
              )}
              {results.map((c, i) => {
                const head = c.group !== lastGroup ? c.group : null;
                lastGroup = c.group;
                return (
                  <li key={c.id} role="presentation">
                    {head && (
                      <p className="label cmdk__group" aria-hidden="true">
                        {head}
                      </p>
                    )}
                    <button
                      type="button"
                      id={`cmdk-${c.id}`}
                      role="option"
                      aria-selected={i === sel}
                      data-index={i}
                      className="cmdk__item"
                      tabIndex={-1}
                      onMouseMove={() => i !== sel && setSel(i)}
                      onClick={() => run(c)}
                    >
                      <span className="cmdk__icon">
                        <Icon name={c.icon} size={16} />
                      </span>
                      <span className="cmdk__label">{c.label}</span>
                      <span className="label cmdk__hint">{c.hint}</span>
                      <span className="cmdk__enter" aria-hidden="true">
                        <Icon name="enter" size={14} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="label cmdk__foot" aria-hidden="true">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> move
              </span>
              <span>
                <kbd>↵</kbd> open
              </span>
              <span>
                <kbd>Esc</kbd> close
              </span>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
