import { T, bodyFont, displayFont } from "../../styles/theme";

export function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: T.surfaceSoft, fg: T.inkSoft },
    gold: { bg: T.goldSoft, fg: "#8A5B12" },
    teal: { bg: T.tealSoft, fg: T.teal },
    berry: { bg: T.berrySoft, fg: T.berry },
    indigo: { bg: T.indigoSoft, fg: T.indigo },
  };
  const c = tones[tone] || tones.neutral;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.fg, fontFamily: bodyFont, letterSpacing: 0.2 }}>{children}</span>;
}

export function ProgressRing({ percent, size = 120, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-label={`Прогресс ${percent}%`}>
    <circle cx={size / 2} cy={size / 2} r={radius} stroke={T.border} strokeWidth={stroke} fill="none" />
    <circle cx={size / 2} cy={size / 2} r={radius} stroke={T.gold} strokeWidth={stroke} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
  </svg>;
}

export function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>;
}

export function SectionLabel({ children }) {
  return <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: 0.6 }}>{children}</div>;
}

export function PageHeader({ eyebrow, title }) {
  return <div style={{ marginBottom: 24 }}>
    {eyebrow && <div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: T.gold, marginBottom: 4 }}>{eyebrow}</div>}
    <h1 style={{ fontFamily: displayFont, fontSize: 30, fontWeight: 600, color: T.ink, margin: 0 }}>{title}</h1>
  </div>;
}

export function MetaRow({ label, value }) {
  return <div><div style={{ fontFamily: bodyFont, fontSize: 11, color: T.inkFaint }}>{label}</div><div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: T.ink }}>{value}</div></div>;
}

export function TermRow({ term, def }) {
  return <div style={{ display: "flex", gap: 10 }}><div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 700, color: T.ink, minWidth: 150 }}>{term}</div><div style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>{def}</div></div>;
}
