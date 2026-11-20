import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { onToast } from "../lib/toast";

/** Glass toasts, bottom centre, announced politely. */
export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(
    () =>
      onToast((item) => {
        setItems((list) => [...list.slice(-2), item]);
        window.setTimeout(
          () => setItems((list) => list.filter((t) => t.id !== item.id)),
          2600,
        );
      }),
    [],
  );

  return (
    <div className="toaster" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            className={`toast toast--${t.tone}`}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <span className="toast__icon">
              <Icon name="check" size={14} />
            </span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
