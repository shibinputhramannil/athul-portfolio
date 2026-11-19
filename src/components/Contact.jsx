import { useState } from "react";
import SectionHead from "./SectionHead";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { Scramble, SplitText } from "./Kinetic";
import { API_URL, sendContact, sendHostedForm } from "../lib/data";
import { toast } from "../lib/toast";
import Waveform from "./Waveform";

const projectTypes = [
  "Short-form / Reels",
  "Ad or promo",
  "Long-form video",
  "Motion graphics",
  "Colour grading",
  "Something else",
];

function ContactForm({ email }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [via, setVia] = useState("form"); // form | mailto
  const [errors, setErrors] = useState({});

  // Last resort: hand the message to the visitor's own email app.
  function openMailApp(data) {
    const subject = `New project${data.project ? ` · ${data.project}` : ""}`;
    const body = `${data.message}\n\n${data.name}${data.email ? ` <${data.email}>` : ""}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setVia("mailto");
    setStatus("sent");
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");
    setErrors({});

    if (!API_URL) {
      // Static site: Netlify Forms delivers it; other hosts can't, so the
      // visitor's email app takes over.
      let delivered = false;
      try {
        delivered = await sendHostedForm(data);
      } catch {
        /* offline or blocked */
      }
      if (!delivered) return openMailApp(data);
      setVia("form");
      setStatus("sent");
      form.reset();
      toast("Brief sent");
      return;
    }

    try {
      const result = await sendContact(data);
      if (result.ok) {
        setVia("form");
        setStatus("sent");
        form.reset();
        toast("Brief sent");
      } else {
        setErrors(result.errors);
        setStatus("error");
      }
    } catch {
      setErrors({ detail: "Couldn't reach the server. Please email instead." });
      setStatus("error");
    }
  }

  const fieldError = (name) =>
    errors[name] ? (
      <span className="form__err" id={`err-${name}`}>
        {[].concat(errors[name]).join(" ")}
      </span>
    ) : null;

  if (status === "sent" && via === "form")
    return (
      <div className="form form--done" role="status">
        <span className="form__done-icon">
          <Icon name="check" size={28} />
        </span>
        <p className="form__done-title">Message received.</p>
        <p className="label">I&apos;ll reply by email.</p>
        <button
          type="button"
          className="pill"
          onClick={() => setStatus("idle")}
        >
          Send another
        </button>
      </div>
    );

  return (
    <form className="form" onSubmit={onSubmit} noValidate={false}>
      <div className="form__row">
        <label className="form__field">
          <span className="label">Name</span>
          <input
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "err-name" : undefined}
          />
          {fieldError("name")}
        </label>
        <label className="form__field">
          <span className="label">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "err-email" : undefined}
          />
          {fieldError("email")}
        </label>
      </div>
      <fieldset className="form__chips">
        <legend className="label">What are we making?</legend>
        {projectTypes.map((t) => (
          <label className="chip" key={t}>
            <input type="radio" name="project" value={t} />
            <span>{t}</span>
          </label>
        ))}
      </fieldset>
      <label className="form__field">
        <span className="label">Brief</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          placeholder="Footage, length, platform, deadline…"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "err-message" : undefined}
        />
        {fieldError("message")}
      </label>
      {/* Honeypot: hidden from people, tempting to bots. */}
      <label className="form__trap" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="form__foot">
        <button
          className="pill pill--solid"
          type="submit"
          disabled={status === "sending"}
        >
          <Icon name="send" size={16} />
          {status === "sending" ? "Sending…" : "Send brief"}
        </button>
        <span className="label form__status" role="status" aria-live="polite">
          {errors.detail ||
            (status === "error" && !Object.keys(errors).length
              ? "Something went wrong."
              : "")}
          {status === "sent" && via === "mailto"
            ? "Opening your email app…"
            : ""}
        </span>
      </div>
    </form>
  );
}

export default function Contact({ number, profile }) {
  const [copied, setCopied] = useState("");
  const [user, domain] = profile.email.split("@");
  const lines = ["Let's make", "the next cut"];

  async function copy() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied("Email copied");
      toast("Email copied");
    } catch {
      setCopied(profile.email);
    }
    setTimeout(() => setCopied(""), 3000);
  }

  return (
    <section
      className="section contact"
      data-section="contact"
      aria-labelledby="contact"
    >
      <div className="wrap">
        <SectionHead number={number} title="Contact" id="contact" />

        <Reveal className="cta">
          <div className="cta__lead">
            <p className="cta__big">
              <SplitText
                className="cta__line"
                text={lines[0]}
                grad="cool"
                hover
                stagger={28}
              />
              <SplitText
                className="cta__line cta__alt"
                text={lines[1]}
                grad="warm"
                hover
                delay={220}
                stagger={28}
              />
            </p>
            <a className="cta__email" href={`mailto:${profile.email}`}>
              <span className="cta__user">{user}</span>
              <span className="cta__at">@</span>
              <wbr />
              {domain}
              <span className="cta__arrow" aria-hidden="true">
                <Icon name="arrow-right" size={28} />
              </span>
            </a>
            <div className="cta__actions">
              <button
                className="pill"
                type="button"
                onClick={copy}
                data-magnet=""
              >
                <Icon name="copy" size={16} />
                Copy email
              </button>
              <span
                className="label cta__status"
                role="status"
                aria-live="polite"
              >
                {copied}
              </span>
            </div>
            <p className="label cta__loc">
              <Icon name="pin" size={14} />
              Based in {profile.location}
            </p>
            <Waveform />
          </div>

          <div className="cta__panel">
            <p className="label cta__kicker">
              <span className="rec" />
              <Scramble text="Open a new project" />
            </p>
            <ContactForm email={profile.email} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
