import AppSidebar from "./AppSidebar";
import { T, bodyFont } from "../../styles/theme";

export default function AppLayout({ screen, streak, onNavigate, children }) {
  return (
    <div style={{ fontFamily: bodyFont, background: T.bg, minHeight: "100vh", display: "flex" }}>
      <AppSidebar screen={screen} streak={streak} onNavigate={onNavigate} />
      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 980, overflowX: "hidden" }}>{children}</main>
    </div>
  );
}
