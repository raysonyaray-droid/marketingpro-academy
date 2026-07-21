export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

export const T = {
  bg: "#EEF1F6",
  surface: "#FFFFFF",
  surfaceSoft: "#F5F7FB",

  ink: "#161A2E",
  inkSoft: "#565C78",
  inkFaint: "#8A90AC",

  border: "#DFE3ED",

  gold: "#E7A33E",
  goldSoft: "#FBEBD1",

  teal: "#2F7A63",
  tealSoft: "#DCEFE7",

  berry: "#B23A56",
  berrySoft: "#F6DEE3",

  indigo: "#3B4A9E",
  indigoSoft: "#E4E7F7",
};

export const displayFont = "'Fraunces', serif";
export const bodyFont = "'Inter', sans-serif";
export const monoFont = "'IBM Plex Mono', monospace";

export const primaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  marginTop: 24,
  padding: "13px 22px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  background: T.ink,
  color: T.surface,
  fontFamily: bodyFont,
  fontSize: 14,
  fontWeight: 600,
};

export const secondaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "13px 22px",
  borderRadius: 12,
  border: `1.5px solid ${T.border}`,
  cursor: "pointer",
  background: "transparent",
  color: T.inkSoft,
  fontFamily: bodyFont,
  fontSize: 14,
  fontWeight: 600,
};

export const ghostBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  cursor: "pointer",
  background: T.surface,
  fontFamily: bodyFont,
  fontSize: 12,
  fontWeight: 600,
  color: T.ink,
};