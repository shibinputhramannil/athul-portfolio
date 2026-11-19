import Icon from "./Icon";

/** Slim closing bar: copyright and a way back to the top. */
export default function Footer({ profile }) {
  const year = new Date().getFullYear();
  return (
    <footer className="credits">
      <div className="wrap credits__bar">
        <span className="label">
          © {year} {profile.name}
        </span>
        <a className="label credits__top" href="#about">
          <Icon name="rewind" size={14} />
          Back to top
        </a>
      </div>
    </footer>
  );
}
