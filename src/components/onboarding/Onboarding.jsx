import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { BIOCARD_CONTEXT, ONBOARD_STEPS } from "../../data/academyConfig";
import { Pill, SectionLabel } from "../ui/Primitives";
import { T, bodyFont, displayFont, primaryBtn, secondaryBtn } from "../../styles/theme";

function OnboardStepField({ step, value, onChange }) {
  if (step.type === "text") {
    return (
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={step.placeholder}
        style={{ width: "100%", minHeight: 70, padding: 14, borderRadius: 10, border: `1px solid ${T.border}`, fontFamily: bodyFont, fontSize: 15, color: T.ink, resize: "vertical", boxSizing: "border-box" }}
      />
    );
  }

  const selectedValues = Array.isArray(value) ? value : [];
  const options = step.options || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((option) => {
        const isSelected = step.type === "multi" ? selectedValues.includes(option) : value === option;
        const handleSelect = () => {
          if (step.type === "multi") {
            onChange(isSelected ? selectedValues.filter((item) => item !== option) : [...selectedValues, option]);
          } else {
            onChange(option);
          }
        };

        return (
          <button key={option} onClick={handleSelect} style={{ textAlign: "left", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${isSelected ? T.ink : T.border}`, background: isSelected ? T.ink : T.surface, color: isSelected ? T.surface : T.ink, fontFamily: bodyFont, fontSize: 15, fontWeight: 500, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {option}{isSelected && <Check size={16} />}
          </button>
        );
      })}
    </div>
  );
}

export default function Onboarding({ onFinish }) {
  const [stepIndex, setStepIndex] = useState(-1);
  const [answers, setAnswers] = useState({});

  if (stepIndex === -1) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <Pill tone="gold"><Sparkles size={13} /> BIOCARD Marketing Academy</Pill>
          <h1 style={{ fontFamily: displayFont, fontSize: 38, fontWeight: 600, margin: "16px 0 12px", color: T.ink, lineHeight: 1.15 }}>Прежде чем начать</h1>
          <p style={{ fontFamily: bodyFont, fontSize: 15, color: T.inkSoft, lineHeight: 1.6, maxWidth: 480, marginBottom: 8 }}>Компания, сфера и ключевые направления вашей работы уже известны из паспорта пользователя — фармацевтическая логистика, внешние и внутренние коммуникации, SMM, HR-бренд. Их не нужно повторять.</p>
          <p style={{ fontFamily: bodyFont, fontSize: 15, color: T.inkSoft, lineHeight: 1.6, maxWidth: 480, marginBottom: 8 }}>Осталось уточнить {ONBOARD_STEPS.length} коротких пунктов — они определят темп, глубину и примеры в курсе. Дальше — честная диагностика в трёх частях, без баллов «на глазок».</p>
          <button onClick={() => setStepIndex(0)} style={primaryBtn}>Начать <ArrowRight size={16} /></button>
        </div>
      </div>
    );
  }

  const step = ONBOARD_STEPS[stepIndex];
  const value = answers[step.key];
  const canContinue = step.optional || (step.type === "multi" ? Boolean(value?.length) : Boolean(value));

  const continueFlow = () => {
    if (stepIndex < ONBOARD_STEPS.length - 1) {
      setStepIndex((current) => current + 1);
    } else {
      onFinish({ ...BIOCARD_CONTEXT, ...answers });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {ONBOARD_STEPS.map((item, index) => <div key={item.key} style={{ height: 4, borderRadius: 2, flex: 1, background: index <= stepIndex ? T.gold : T.border, transition: "background 0.3s ease" }} />)}
        </div>
        <SectionLabel>Шаг {stepIndex + 1} из {ONBOARD_STEPS.length}</SectionLabel>
        <h2 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, color: T.ink, margin: "8px 0 20px" }}>{step.title}</h2>
        <OnboardStepField step={step} value={value} onChange={(nextValue) => setAnswers((current) => ({ ...current, [step.key]: nextValue }))} />
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={() => setStepIndex((current) => current - 1)} style={secondaryBtn}><ArrowLeft size={15} /> Назад</button>
          <button onClick={continueFlow} disabled={!canContinue} style={{ ...primaryBtn, marginTop: 0, opacity: canContinue ? 1 : 0.4 }}>{stepIndex < ONBOARD_STEPS.length - 1 ? "Далее" : "К диагностике"} <ArrowRight size={15} /></button>
        </div>
      </div>
    </div>
  );
}
