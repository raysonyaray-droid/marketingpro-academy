import { useEffect, useMemo, useState } from "react";
import { loadAcademyState, saveAcademyState } from "../services/academyStorage";

export const DEFAULT_ACADEMY_STATE = {
  profile: null,
  competencies: null,
  rawDiag: null,
  completedLessons: 0,
  points: 0,
  streak: 0,
  lastActive: null,
  practiceStore: {},
  portfolio: {},
  notes: "",
  history: [],
  _openLesson: null,
};

function resolveInitialState(savedState) {
  if (!savedState) return DEFAULT_ACADEMY_STATE;

  const today = new Date().toISOString().slice(0, 10);
  let streak = savedState.streak || 0;

  if (savedState.lastActive) {
    const differenceInDays = Math.round((new Date(today) - new Date(savedState.lastActive)) / 86400000);
    if (differenceInDays === 1) streak += 1;
    if (differenceInDays > 1) streak = 1;
  } else {
    streak = 1;
  }

  return { ...DEFAULT_ACADEMY_STATE, ...savedState, streak, lastActive: today };
}

export default function useAcademyState() {
  const [initialSnapshot] = useState(() => {
    const savedState = loadAcademyState();
    const stage = savedState?.profile && savedState?.competencies
      ? "app"
      : savedState?.profile
        ? "diagnostic"
        : "onboarding";

    return { state: resolveInitialState(savedState), stage };
  });
  const [state, setState] = useState(initialSnapshot.state);
  const [stage, setStage] = useState(initialSnapshot.stage);
  const [screen, setScreen] = useState("dashboard");
  const loaded = true;

  useEffect(() => {
    saveAcademyState(state);
  }, [state]);

  const pushHistory = (text) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((current) => ({ ...current, history: [...(current.history || []), { date: today, text }] }));
  };

  const actions = useMemo(() => ({
    finishOnboarding(profile) {
      setState((current) => ({ ...current, profile }));
      setStage("diagnostic");
    },
    completeDiagnostic({ competencies, rawDiag }) {
      setState((current) => ({ ...current, competencies, rawDiag, points: current.points + 20 }));
      pushHistory("Пройдена входная диагностика");
      setStage("app");
      setScreen("dashboard");
    },
    openLesson(lessonId) {
      setState((current) => ({ ...current, _openLesson: lessonId }));
      setScreen("lesson");
    },
    completeLesson(lessonId, score, total) {
      setState((current) => ({
        ...current,
        completedLessons: Math.max(current.completedLessons, lessonId),
        points: current.points + 30 + score * 5,
        history: [...(current.history || []), { date: new Date().toISOString().slice(0, 10), text: `Завершён урок ${lessonId} (тест ${score}/${total})` }],
      }));
      setScreen("moduleOverview");
    },
    savePractice(lessonKey, level, value) {
      setState((current) => ({ ...current, practiceStore: { ...current.practiceStore, [lessonKey]: { ...(current.practiceStore[lessonKey] || {}), [level]: value } } }));
    },
    savePortfolio(work) {
      setState((current) => ({ ...current, portfolio: { ...current.portfolio, module1FinalWork: work } }));
    },
    updateProfile(profile) {
      setState((current) => ({ ...current, profile }));
    },
    updateNotes(notes) {
      setState((current) => ({ ...current, notes }));
    },
  }), []);

  const userContext = useMemo(() => {
    if (!state.profile) return "";
    return `${state.profile.position || "специалист по коммуникациям"} в ${state.profile.company}, сфера — ${state.profile.sphere}. Ключевые направления: ${(state.profile.directions || []).join(", ")}.`;
  }, [state.profile]);

  return { loaded, state, stage, screen, setScreen, actions, userContext };
}
