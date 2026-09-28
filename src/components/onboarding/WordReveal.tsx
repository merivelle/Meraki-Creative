/**
 * Splits a line into words that fade up one after another (CSS-driven; see onboarding.css).
 * Screen readers get the sentence once, as plain text; the animated words are hidden from them.
 */
export function WordReveal({ text, as: Tag = "span", className, delayStart = 0 }: {
  text: string;
  as?: "span" | "h1" | "p";
  className?: string;
  delayStart?: number;
}) {
  const words = text.split(" ");
  return (
    <Tag className={`ob-reveal ${className ?? ""}`}>
      <span className="visually-hidden">{text}</span>
      {words.map((w, i) => (
        <span key={i} className="ob-word" aria-hidden="true" style={{ "--i": i + delayStart } as React.CSSProperties}>
          {w}{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
