import { BookOpen, FileText, Flame, LayoutGrid, Library, Sparkles, Trophy, User } from "lucide-react";
import { T, bodyFont, displayFont, monoFont } from "../../styles/theme";

const NAV_ITEMS = [
  { key: "dashboard", label: "Главный экран", icon: LayoutGrid },
  { key: "map", label: "Карта курса", icon: BookOpen },
  { key: "moduleOverview", label: "Модуль 1", icon: FileText },
  { key: "portfolio", label: "Портфолио", icon: Trophy },
  { key: "cabinet", label: "Личный кабинет", icon: User },
  { key: "library", label: "Библиотека", icon: Library },
];

function NavButton({ icon: Icon, label, active, onClick }) {
  return <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: active ? T.ink : "transparent", color: active ? T.surface : T.inkSoft, fontFamily: bodyFont, fontSize: 14, fontWeight: 600, textAlign: "left", transition: "background 0.15s ease" }}>
    <Icon size={17} strokeWidth={2} />{label}
  </button>;
}

export default function AppSidebar({ screen, streak, onNavigate }) {
  return <aside className="academy-sidebar" style={{ width: 230, borderRight: `1px solid ${T.border}`, padding: 20, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", marginBottom: 18 }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={14} color={T.gold} /></div>
      <span style={{ fontFamily: displayFont, fontWeight: 600, fontSize: 15, color: T.ink }}>BIOCARD Academy</span>
    </div>
    {NAV_ITEMS.map((item) => <NavButton key={item.key} icon={item.icon} label={item.label} active={screen === item.key} onClick={() => onNavigate(item.key)} />)}
    <div style={{ marginTop: "auto", padding: 12, borderRadius: 12, background: T.surfaceSoft }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><Flame size={14} color={T.berry} /><span style={{ fontFamily: monoFont, fontSize: 13, fontWeight: 600, color: T.ink }}>{streak} дн.</span></div>
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: T.inkFaint }}>серия обучения</div>
    </div>
  </aside>;
}
