import { useInView } from "../hooks/useInView";

const cx = (...c) => c.filter(Boolean).join(" ");

/**
 * Adds "is-in" once the element scrolls into view. `fade` opts into the
 * shared fade-up style; `i` staggers it.
 */
export default function Reveal({
  as: Tag = "div",
  className,
  fade = false,
  i,
  style,
  threshold = 0.15,
  children,
  ...rest
}) {
  const [ref, inView] = useInView({ threshold });
  return (
    <Tag
      ref={ref}
      className={cx(className, inView && "is-in")}
      data-fade={fade ? "" : undefined}
      style={i != null ? { ...style, "--i": i } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export { cx };
