import {
  siAdobeaftereffects,
  siAdobepremierepro,
  siDavinciresolve,
} from "simple-icons";
import { uiIcons } from "../lib/icons";

const brands = {
  premiere: siAdobepremierepro,
  aftereffects: siAdobeaftereffects,
  resolve: siDavinciresolve,
};

const luminance = (hex) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/**
 * Stroke UI icons (24px grid) or brand marks. Decorative unless `label` is
 * given, in which case the icon is announced as an image.
 */
export default function Icon({ name, brand, size = 18, label, className }) {
  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": "true" };
  const cls = ["icon", brand && "icon--brand", className]
    .filter(Boolean)
    .join(" ");

  if (brand) {
    const mark = brands[brand];
    if (!mark) return null;
    const color = luminance(mark.hex) < 0.35 ? "var(--mist)" : `#${mark.hex}`;
    return (
      <svg
        className={cls}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ color }}
        {...a11y}
      >
        <path d={mark.path} fill="currentColor" />
      </svg>
    );
  }
  if (!name || !uiIcons[name]) return null;
  return (
    <svg
      className={cls}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: uiIcons[name] }}
      {...a11y}
    />
  );
}
