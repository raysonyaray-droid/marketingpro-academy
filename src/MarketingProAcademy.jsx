import { useState, useEffect, useMemo } from "react";
import AppSidebar from "./components/layout/AppSidebar";
import { Card, MetaRow, PageHeader, Pill, ProgressRing, SectionLabel, TermRow } from "./components/ui/Primitives";
import { MODULES } from "./data/courseCatalog";
import { loadAcademyState, saveAcademyState } from "./services/academyStorage";
import { FONTS, T, bodyFont, displayFont, ghostBtn, monoFont, primaryBtn, secondaryBtn } from "./styles/theme";
import StepLesson from "./StepLesson";
import {
  Flame, Star, Trophy, CheckCircle2, Lock, ArrowRight, ArrowLeft,
  BookOpen, Sparkles, Target, ChevronRight,
  X, Check, Copy, Search, Loader2,
  Save, Send, Info, Home, Map, Briefcase, User, Library,
} from "lucide-react";

/* ============================================================
   ИИ-НАСТАВНИК. Реальная проверка практических ответов через
   Anthropic API. При ошибке сети — честное сообщение об этом,
   а не имитация персональной обратной связи.
   ============================================================ */

async function callAIMentor({ task, answer, context }) {
  const endpoint = import.meta.env.VITE_AI_MENTOR_URL;

  if (!endpoint) {
    return {
      ok: false,
      text: "Ответ сохранён. ИИ-наставник пока не подключён: добавьте адрес серверного API в переменную VITE_AI_MENTOR_URL.",
    };
  }

  const system = `Ты — строгий ИИ-наставник курса BIOCARD Marketing Academy. Проверяй только по фактам из задания и ответа студента. Не придумывай контекст, не хвали автоматически и не маскируй ошибки мягкими формулировками. Оцени по пяти критериям: соответствие вопросу, логика, использование понятий урока, конкретность, применимость в рабочей ситуации. Если данных недостаточно, прямо укажи, чего именно не хватает. Дай ответ по-русски, без markdown-заголовков, в структуре: Результат; Сильная сторона; Критическая ошибка или пробел; Практический риск; Следующий шаг. В конце добавь оценку от 0 до 100 и короткий вердикт: «зачтено», «нужна доработка» или «не зачтено». Общий объём — 7–10 предложений, без общих фраз вроде «отличная работа».`;
  const user = `Контекст пользователя: ${context || "специалист по маркетингу и коммуникациям"}.\nЗадание: ${task}\nОтвет студента: ${answer}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, user }),
    });

    if (!response.ok) {
      throw new Error(`AI mentor request failed: ${response.status}`);
    }

    const data = await response.json();
    const text = [
      data?.text,
      data?.feedback,
      data?.message,
      data?.content?.[0]?.text,
      data?.choices?.[0]?.message?.content,
      data?.result?.text,
    ].find((value) => typeof value === "string" && value.trim())?.trim() || "";

    if (!text) {
      throw new Error("AI mentor returned an empty response");
    }

    return { ok: true, text };
  } catch {
    return {
      ok: false,
      text: "Ответ сохранён. ИИ-наставник сейчас недоступен — попробуйте ещё раз позже.",
    };
  }
}

function shuffle(arr, seed) {
  const a = arr.map((x, i) => [x, i]);
  let s = seed || Math.floor(Math.random() * 100000);
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.map(([x]) => x);
}

/* ============================================================
   BIOCARD — подтверждённый профессиональный контекст.
   Заполненные поля считаются достоверными (паспорт пользователя),
   поля «уточнить» задаются как реальные вопросы онбординга.
   ============================================================ */

const BIOCARD_CONTEXT = {
  company: "BIOCARD",
  sphere: "Фармацевтическая логистика, поставки медицинской продукции, корпоративные и внешние коммуникации",
  directions: ["SMM и корпоративные соцсети", "Внутренние коммуникации", "HR-бренд и вакансии", "Видео и интервью", "Коммуникация с руководителями"],
  tasks: "Посты, сценарии и вопросы для интервью, анонсы, вакансии, внутренние рассылки, контент-планы, адаптация материалов под разные каналы",
  textPreference: "Живой человеческий язык без канцелярита и признаков генерации ИИ",
};

/* ============================================================
   ОНБОРДИНГ — короткие последовательные шаги. Подтверждённый
   контекст BIOCARD применяется автоматически; «уточнить»-поля
   из паспорта задаются как реальные вопросы, без догадок.
   ============================================================ */

const ONBOARD_STEPS = [
  { key: "preferredName", type: "text", title: "Как к вам обращаться внутри курса?", placeholder: "Имя или как вам удобно" },
  { key: "position", type: "text", title: "Как называется ваша должность сейчас?", placeholder: "Например: специалист по коммуникациям" },
  { key: "experience", type: "single", title: "Сколько лет вы регулярно выполняете такие задачи?",
    options: ["Меньше 1 года", "1–3 года", "3–7 лет", "Больше 7 лет"] },
  { key: "autonomy", type: "single", title: "Какие решения вы принимаете самостоятельно?",
    options: ["Согласую большинство решений", "Решаю тактические задачи сам, стратегию — согласую", "Принимаю большинство решений самостоятельно"] },
  { key: "team", type: "multi", title: "Есть ли у вас команда или подрядчики?",
    options: ["Работаю один", "Дизайнер", "Видеограф / монтажёр", "SMM-помощник", "Внешнее агентство", "Другое"] },
  { key: "weeklyTime", type: "single", title: "Сколько часов в неделю вы реально готовы уделять обучению?",
    options: ["До 2 часов", "2–5 часов", "5–10 часов", "Больше 10 часов"] },
  { key: "sessionLength", type: "single", title: "Какой формат занятия удобнее?",
    options: ["20–30 минут", "45–60 минут", "90 минут"] },
  { key: "priority", type: "text", title: "Какой реальный проект должен улучшиться благодаря курсу за 3 месяца?", placeholder: "Например: система вакансий и HR-бренд" },
  { key: "dataAccess", type: "single", title: "Какие данные каналов и кампаний вам доступны?",
    options: ["Полный доступ к метрикам", "Частичный доступ / через отчёты", "Доступа к аналитике нет", "Другое"] },
  { key: "confidentiality", type: "text", title: "Что нельзя использовать в учебных кейсах?", placeholder: "Необязательно — например: реальные контракты, медицинские данные", optional: true },
];

function OnboardStepField({ step, value, onChange }) {
  if (step.type === "text") {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={step.placeholder}
        style={{ width: "100%", minHeight: 70, padding: 14, borderRadius: 10, border: `1px solid ${T.border}`,
          fontFamily: bodyFont, fontSize: 15, color: T.ink, resize: "vertical", boxSizing: "border-box" }}
      />
    );
  }
  if (step.type === "single") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {step.options.map((opt) => (
          <button key={opt} onClick={() => onChange(opt)} style={{
            textAlign: "left", padding: "14px 16px", borderRadius: 12,
            border: `1.5px solid ${value === opt ? T.ink : T.border}`,
            background: value === opt ? T.ink : T.surface, color: value === opt ? T.surface : T.ink,
            fontFamily: bodyFont, fontSize: 15, fontWeight: 500, cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {opt}{value === opt && <Check size={16} />}
          </button>
        ))}
      </div>
    );
  }
  if (step.type === "multi") {
    const sel = Array.isArray(value) ? value : [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {step.options.map((opt) => {
          const isSel = sel.includes(opt);
          return (
            <button key={opt} onClick={() => onChange(isSel ? sel.filter((x) => x !== opt) : [...sel, opt])} style={{
              textAlign: "left", padding: "14px 16px", borderRadius: 12,
              border: `1.5px solid ${isSel ? T.ink : T.border}`,
              background: isSel ? T.ink : T.surface, color: isSel ? T.surface : T.ink,
              fontFamily: bodyFont, fontSize: 15, fontWeight: 500, cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {opt}{isSel && <Check size={16} />}
            </button>
          );
        })}
      </div>
    );
  }
  return null;
}

function Onboarding({ onFinish }) {
  const [idx, setIdx] = useState(-1); // -1 = приветствие
  const [answers, setAnswers] = useState({});

  if (idx === -1) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <Pill tone="gold"><Sparkles size={13} /> BIOCARD Marketing Academy</Pill>
          <h1 style={{ fontFamily: displayFont, fontSize: 38, fontWeight: 600, margin: "16px 0 12px", color: T.ink, lineHeight: 1.15 }}>
            Прежде чем начать
          </h1>
          <p style={{ fontFamily: bodyFont, fontSize: 15, color: T.inkSoft, lineHeight: 1.6, maxWidth: 480, marginBottom: 8 }}>
            Компания, сфера и ключевые направления вашей работы уже известны из паспорта пользователя —
            фармацевтическая логистика, внешние и внутренние коммуникации, SMM, HR-бренд. Их не нужно повторять.
          </p>
          <p style={{ fontFamily: bodyFont, fontSize: 15, color: T.inkSoft, lineHeight: 1.6, maxWidth: 480, marginBottom: 8 }}>
            Осталось уточнить {ONBOARD_STEPS.length} коротких пунктов — они определят темп, глубину и примеры
            в курсе. Дальше — честная диагностика в трёх частях, без баллов «на глазок».
          </p>
          <button onClick={() => setIdx(0)} style={primaryBtn}>Начать <ArrowRight size={16} /></button>
        </div>
      </div>
    );
  }

  const step = ONBOARD_STEPS[idx];
  const val = answers[step.key];
  const canNext = step.optional || (step.type === "multi" ? (val && val.length > 0) : !!val);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {ONBOARD_STEPS.map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, flex: 1, background: i <= idx ? T.gold : T.border, transition: "background 0.3s ease" }} />
          ))}
        </div>
        <SectionLabel>Шаг {idx + 1} из {ONBOARD_STEPS.length}</SectionLabel>
        <h2 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, color: T.ink, margin: "8px 0 20px" }}>{step.title}</h2>
        <OnboardStepField step={step} value={val} onChange={(v) => setAnswers({ ...answers, [step.key]: v })} />
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={() => setIdx(idx - 1)} style={secondaryBtn}><ArrowLeft size={15} /> Назад</button>
          <button
            onClick={() => idx < ONBOARD_STEPS.length - 1 ? setIdx(idx + 1) : onFinish({ ...BIOCARD_CONTEXT, ...answers })}
            disabled={!canNext}
            style={{ ...primaryBtn, marginTop: 0, opacity: canNext ? 1 : 0.4 }}>
            {idx < ONBOARD_STEPS.length - 1 ? "Далее" : "К диагностике"} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ДИАГНОСТИКА — часть A (фундамент), часть B (кейсы), часть C
   (открытая работа под профиль). Ответы не раскрываются до
   конца всей диагностики; варианты перемешиваются каждый раз.
   ============================================================ */

const PART_A = [
  { id: "a1", tag: "terms", q: "Компания вложилась в рекламу нового продукта, но не изменила ни цену, ни каналы продаж, ни сам продукт. Что из этого является маркетингом, а что — только рекламой?",
    options: [
      { t: "Реклама — часть маркетинга; маркетинг шире и включает решения о продукте, цене и каналах, а не только сообщение", correct: true },
      { t: "Реклама и маркетинг — синонимы, разницы нет" },
      { t: "Маркетинг — это только реклама, а цена и каналы к нему не относятся" },
      { t: "Реклама всегда шире маркетинга и включает его в себя" },
    ] },
  { id: "a2", tag: "terms", q: "Чем PR принципиально отличается от рекламы?", options: [
      { t: "PR управляет репутацией и отношениями со СМИ и обществом, часто без прямой оплаты за размещение", correct: true },
      { t: "PR — это просто более дорогая реклама" },
      { t: "PR никак не связан с маркетингом" },
      { t: "PR и реклама всегда покупаются в одном и том же бюджете и неразличимы" },
    ] },
  { id: "a3", tag: "terms", q: "Продажи как функция отличаются от маркетинга тем, что:", options: [
      { t: "Продажи — завершающий этап пути клиента, а маркетинг готовит почву — формирует спрос заранее", correct: true },
      { t: "Продажи и маркетинг — одна и та же функция под разными названиями" },
      { t: "Маркетинг начинается только после того, как продажи не сработали" },
      { t: "Продажи не имеют отношения к пути клиента" },
    ] },
  { id: "a4", tag: "terms", q: "Брендинг в первую очередь отвечает за:", options: [
      { t: "Расчёт бюджета кампании" },
      { t: "Образ компании в сознании аудитории — имя, стиль, характер, ассоциации", correct: true },
      { t: "Логистику и сроки поставки" },
      { t: "Юридическое оформление сделок" },
    ] },
  { id: "a5", tag: "concepts", q: "Разница между потребностью и желанием в том, что:", options: [
      { t: "Это синонимы, различий нет" },
      { t: "Потребность — базовое ощущение нехватки, желание — её конкретная форма под влиянием культуры и личности", correct: true },
      { t: "Желание существует раньше потребности" },
      { t: "Потребность создаётся маркетингом, а желание — нет" },
    ] },
  { id: "a6", tag: "concepts", q: "Два человека одинаково хотят один и тот же продукт, но купить может только один — у него есть на это деньги. У кого из них есть спрос?", options: [
      { t: "У обоих в равной мере" },
      { t: "Ни у кого, спрос появляется только на распродаже" },
      { t: "Только у того, кто готов и способен заплатить", correct: true },
      { t: "У того, кто громче заявляет о своём интересе" },
    ] },
  { id: "a7", tag: "concepts", q: "Ценность продукта для клиента определяется как:", options: [
      { t: "Розничная цена продукта" },
      { t: "Соотношение выгод, которые получает клиент, и издержек — денег, времени, усилий, которые он тратит", correct: true },
      { t: "Себестоимость производства" },
      { t: "Количество функций у продукта" },
    ] },
  { id: "a8", tag: "goals", q: "«Мы хотим стать заметнее в отрасли» — это, скорее всего:", options: [
      { t: "Чёткая маркетинговая цель, готовая к работе" },
      { t: "Формулировка, которую нужно ещё довести до измеримой цели с метрикой и сроком", correct: true },
      { t: "Уже готовая стратегия" },
      { t: "Тактика, а не цель" },
    ] },
  { id: "a9", tag: "goals", q: "Отличие стратегии от тактики в том, что:", options: [
      { t: "Стратегия — это выбор общего направления и приоритетов, тактика — конкретные действия для его реализации", correct: true },
      { t: "Тактика определяет цели бизнеса, а стратегия — только каналы" },
      { t: "Это взаимозаменяемые понятия" },
      { t: "Стратегия — это просто более длинный список задач" },
    ] },
  { id: "a10", tag: "models", q: "Модель STP используется для того, чтобы:", options: [
      { t: "Рассчитать рекламный бюджет" },
      { t: "Выбрать аудиторию: сегментировать рынок, выбрать целевой сегмент и сформулировать позиционирование", correct: true },
      { t: "Составить план продаж на квартал" },
      { t: "Оценить итоговую удовлетворённость клиентов" },
    ] },
  { id: "a11", tag: "models", q: "Customer Journey как модель описывает:", options: [
      { t: "Только этап рекламной кампании" },
      { t: "Весь путь клиента от узнавания о продукте до покупки и повторного обращения через все точки контакта", correct: true },
      { t: "Организационную структуру отдела маркетинга" },
      { t: "Расчёт цены на разных этапах производства" },
    ] },
  { id: "a12", tag: "models", q: "Маркетинговая воронка показывает:", options: [
      { t: "Как широкая аудитория постепенно сужается до узкого круга покупателей", correct: true },
      { t: "Как распределить сотрудников по отделам" },
      { t: "Как выбрать рекламный канал" },
      { t: "Как рассчитать себестоимость продукта" },
    ] },
];

const PART_B = [
  { id: "b1", tag: "diagnosis", q: "Компания увеличивает рекламный бюджет второй месяц подряд, но продажи не растут. Что стоит проверить в первую очередь?", options: [
      { t: "Сразу удвоить бюджет ещё раз" },
      { t: "Отделить, в чём именно проблема — в аудитории, продукте, цене, доверии или измерении результата — прежде чем менять бюджет", correct: true },
      { t: "Полностью остановить весь маркетинг" },
      { t: "Сменить агентство, не разбираясь в причине" },
    ] },
  { id: "b2", tag: "diagnosis", q: "Руководитель называет контент-план стратегией и просит «согласовать стратегию» за 15 минут. Разумная реакция:", options: [
      { t: "Молча согласовать, чтобы не спорить с руководителем" },
      { t: "Уточнить: контент-план — это тактический инструмент; для стратегии нужны цель, аудитория и позиционирование, на которые план должен опираться", correct: true },
      { t: "Отказаться от задачи полностью" },
      { t: "Переименовать контент-план в «стратегию» в документе" },
    ] },
  { id: "b3", tag: "diagnosis", q: "У публикации высокий охват, но целевое действие (переход, заявка, отклик) почти отсутствует. Вероятная причина:", options: [
      { t: "Охват сам по себе гарантирует результат, проблемы нет" },
      { t: "Контент увидело много нерелевantных людей, либо сообщение не ведёт к чёткому действию — нужно проверить аудиторию и призыв к действию", correct: true },
      { t: "Нужно просто ещё увеличить охват" },
      { t: "Метрика охвата вообще не имеет значения" },
    ] },
  { id: "b4", tag: "diagnosis", q: "Сотрудники не понимают причины организационного изменения, хотя рассылка была отправлена. Вероятная причина:", options: [
      { t: "Сообщение объяснило факт изменения, но не объяснило причину и не дало возможности задать вопросы", correct: true },
      { t: "Сотрудники просто невнимательно читают письма" },
      { t: "Рассылка была недостаточно красиво оформлена" },
      { t: "Проблема точно в неправильном канале рассылки" },
    ] },
  { id: "b5", tag: "diagnosis", q: "Вакансия получает много просмотров, но мало релевантных откликов. Вероятная причина:", options: [
      { t: "Нужно просто поднять зарплату в описании" },
      { t: "Причина может быть в аудитории размещения, тексте задач, требованиях или процессе отклика — нужно диагностировать, а не менять один элемент наугад", correct: true },
      { t: "Вакансии в принципе не работают как канал" },
      { t: "Дело только в оформлении объявления" },
    ] },
  { id: "b6", tag: "diagnosis", q: "B2B-компания использует одно и то же сообщение для рядового пользователя продукта, финансового директора и генерального директора. Проблема в том, что:", options: [
      { t: "Так и должно быть — сообщение должно быть одинаковым для консистentности" },
      { t: "У разных участников закупочного центра разные критерии решения (удобство, стоимость владения, риски), и сообщение должно учитывать это различие", correct: true },
      { t: "Различия внутри закупочного центра не влияют на маркетинг" },
      { t: "Нужно просто сделать сообщение короче для всех" },
    ] },
];


function DiagnosticIntro({ onStart }) {
  return (
    <div>
      <Pill tone="indigo"><Target size={13} /> Диагностика в трёх частях</Pill>
      <h2 style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 600, color: T.ink, margin: "16px 0 10px" }}>
        Честная диагностика, а не оценка «на глазок»
      </h2>
      <p style={{ fontFamily: bodyFont, fontSize: 15, color: T.inkSoft, lineHeight: 1.6, maxWidth: 500, marginBottom: 10 }}>
        Часть A — {PART_A.length} заданий на фундаментальные понятия. Часть B — {PART_B.length} практических кейсов
        с коротким обоснованием. Часть C — одна открытая работа под вашу реальную роль.
      </p>
      <p style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkFaint, lineHeight: 1.6, marginBottom: 20 }}>
        Правильность не показывается по ходу — результат вы увидите только после завершения всех трёх частей.
        Двух вопросов недостаточно, чтобы утверждать «навык на 20%» — поэтому по итогам вы получите уровни
        (недостаточно данных / начальный / базовый / уверенный / продвинутый), а не выдуманные проценты.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onStart} style={{ ...primaryBtn, marginTop: 0 }}>Начать диагностику <ArrowRight size={15} /></button>
      </div>
    </div>
  );
}

function DiagnosticRunner({ onDone }) {
  const [phase, setPhase] = useState("A"); // A | B | C | done-collecting
  const seed = 48271;
  const [aIdx, setAIdx] = useState(0);
  const [aAnswers, setAAnswers] = useState({});
  const [aSelected, setASelected] = useState(null);
  const [bIdx, setBIdx] = useState(0);
  const [bAnswers, setBAnswers] = useState({});
  const [bSelected, setBSelected] = useState(null);
  const [bJustify, setBJustify] = useState("");
  const [cAnswer, setCAnswer] = useState("");

  const aShuffled = useMemo(() => PART_A.map((q, i) => ({ ...q, order: shuffle(q.options.map((_, oi) => oi), seed + i) })), [seed]);
  const bShuffled = useMemo(() => PART_B.map((q, i) => ({ ...q, order: shuffle(q.options.map((_, oi) => oi), seed + 500 + i) })), [seed]);

  if (phase === "A") {
    const q = aShuffled[aIdx];
    const orderedOptions = q.order.map((oi) => q.options[oi]);
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <SectionLabel>Часть A · Вопрос {aIdx + 1} из {PART_A.length}</SectionLabel>
          <Pill tone="indigo">Фундамент</Pill>
        </div>
        <Card>
          <p style={{ fontFamily: bodyFont, fontSize: 16, fontWeight: 500, color: T.ink, lineHeight: 1.5, margin: "0 0 18px" }}>{q.q}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orderedOptions.map((opt, i) => (
              <button key={i} onClick={() => setASelected(q.order[i])} style={{
                textAlign: "left", padding: "13px 16px", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${aSelected === q.order[i] ? T.ink : T.border}`,
                background: aSelected === q.order[i] ? T.surfaceSoft : T.surface,
                fontFamily: bodyFont, fontSize: 14, color: T.ink }}>{opt.t}</button>
            ))}
          </div>
          <button onClick={() => {
            setAAnswers({ ...aAnswers, [q.id]: aSelected });
            setASelected(null);
            if (aIdx < PART_A.length - 1) setAIdx(aIdx + 1); else setPhase("B");
          }} disabled={aSelected === null} style={{ ...primaryBtn, marginTop: 18, opacity: aSelected === null ? 0.4 : 1 }}>
            {aIdx < PART_A.length - 1 ? "Далее" : "К части B"} <ArrowRight size={15} />
          </button>
        </Card>
      </div>
    );
  }

  if (phase === "B") {
    const q = bShuffled[bIdx];
    const orderedOptions = q.order.map((oi) => q.options[oi]);
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <SectionLabel>Часть B · Кейс {bIdx + 1} из {PART_B.length}</SectionLabel>
          <Pill tone="gold">Ход рассуждения</Pill>
        </div>
        <Card>
          <p style={{ fontFamily: bodyFont, fontSize: 16, fontWeight: 500, color: T.ink, lineHeight: 1.5, margin: "0 0 18px" }}>{q.q}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {orderedOptions.map((opt, i) => (
              <button key={i} onClick={() => setBSelected(q.order[i])} style={{
                textAlign: "left", padding: "13px 16px", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${bSelected === q.order[i] ? T.ink : T.border}`,
                background: bSelected === q.order[i] ? T.surfaceSoft : T.surface,
                fontFamily: bodyFont, fontSize: 14, color: T.ink }}>{opt.t}</button>
            ))}
          </div>
          <SectionLabel>Коротко обоснуйте выбор</SectionLabel>
          <textarea value={bJustify} onChange={(e) => setBJustify(e.target.value)} placeholder="Почему именно этот вариант?"
            style={{ width: "100%", minHeight: 70, marginTop: 8, padding: 12, borderRadius: 10, border: `1px solid ${T.border}`,
              fontFamily: bodyFont, fontSize: 13, color: T.ink, resize: "vertical", boxSizing: "border-box" }} />
          <button onClick={() => {
            setBAnswers({ ...bAnswers, [q.id]: { selected: bSelected, justify: bJustify } });
            setBSelected(null); setBJustify("");
            if (bIdx < PART_B.length - 1) setBIdx(bIdx + 1); else setPhase("C");
          }} disabled={bSelected === null} style={{ ...primaryBtn, marginTop: 18, opacity: bSelected === null ? 0.4 : 1 }}>
            {bIdx < PART_B.length - 1 ? "Далее" : "К части C"} <ArrowRight size={15} />
          </button>
        </Card>
      </div>
    );
  }

  if (phase === "C") {
    return (
      <div>
        <SectionLabel>Часть C · Открытая работа</SectionLabel>
        <Card style={{ marginTop: 14 }}>
          <p style={{ fontFamily: bodyFont, fontSize: 15, color: T.ink, lineHeight: 1.6, marginBottom: 16 }}>
            Опишите одну реальную или типичную для вас коммуникационную задачу за последний месяц: какая была цель,
            кому она адресована и как вы поняли бы, что задача решена. Если такой задачи не было — смоделируйте её.
          </p>
          <textarea value={cAnswer} onChange={(e) => setCAnswer(e.target.value)} placeholder="Опишите задачу своими словами…"
            style={{ width: "100%", minHeight: 140, padding: 14, borderRadius: 10, border: `1px solid ${T.border}`,
              fontFamily: bodyFont, fontSize: 14, color: T.ink, resize: "vertical", boxSizing: "border-box" }} />
          <button onClick={() => onDone({ a: aAnswers, b: bAnswers, c: cAnswer })} disabled={!cAnswer.trim()}
            style={{ ...primaryBtn, opacity: cAnswer.trim() ? 1 : 0.4 }}>
            Завершить диагностику <ArrowRight size={15} />
          </button>
        </Card>
      </div>
    );
  }
  return null;
}

/* Компетенции: собраны из тегов части A и части B. Часть C —
   качественная работа, не даёт числовой доли, но фиксируется как
   первое портфолио-свидетельство. */
const COMPETENCY_META = [
  { key: "terms", label: "Разграничение маркетинга, рекламы, PR, продаж, брендинга", tags: ["terms"], part: "A" },
  { key: "concepts", label: "Потребность, желание, спрос, ценность", tags: ["concepts"], part: "A" },
  { key: "goals", label: "Цель, стратегия, тактика, инструмент", tags: ["goals"], part: "A" },
  { key: "models", label: "STP, 4P, Customer Journey, воронка", tags: ["models"], part: "A" },
  { key: "diagnosis", label: "Диагностика реальной коммуникационной проблемы", tags: ["diagnosis"], part: "B" },
];

function levelFromRatio(ratio, evidence) {
  if (evidence < 2) return "недостаточно данных";
  if (ratio < 0.4) return "начальный";
  if (ratio < 0.65) return "базовый";
  if (ratio < 0.85) return "уверенный";
  return "продвинутый";
}
function confidenceFromEvidence(evidence) {
  if (evidence < 2) return "низкая";
  if (evidence < 4) return "средняя";
  return "высокая";
}

function computeCompetencyProfile(diag) {
  return COMPETENCY_META.map((c) => {
    let correct = 0, total = 0, wrongTopics = [];
    if (c.part === "A") {
      PART_A.filter((q) => c.tags.includes(q.tag)).forEach((q) => {
        total += 1;
        const sel = diag.a[q.id];
        const isRight = sel !== undefined && q.options[sel] && q.options[sel].correct;
        if (isRight) correct += 1; else wrongTopics.push(q.q.slice(0, 60) + "…");
      });
    } else {
      PART_B.filter((q) => c.tags.includes(q.tag)).forEach((q) => {
        total += 1;
        const sel = diag.b[q.id] && diag.b[q.id].selected;
        const isRight = sel !== undefined && q.options[sel] && q.options[sel].correct;
        if (isRight) correct += 1; else wrongTopics.push(q.q.slice(0, 60) + "…");
      });
    }
    const ratio = total ? correct / total : 0;
    return {
      key: c.key, label: c.label, evidence: total, correct,
      level: levelFromRatio(ratio, total), confidence: confidenceFromEvidence(total),
      wrongTopics, lastChecked: new Date().toISOString().slice(0, 10),
    };
  });
}

function DiagnosticResults({ competencies, onFinish }) {
  return (
    <div>
      <Pill tone="teal"><Trophy size={13} /> Диагностика завершена</Pill>
      <h2 style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 600, color: T.ink, margin: "16px 0 6px" }}>Ваш обоснованный профиль</h2>
      <p style={{ fontFamily: bodyFont, fontSize: 14, color: T.inkFaint, marginBottom: 20, maxWidth: 540 }}>
        Уровни ниже — не проценты, а честная оценка по количеству заданий-подтверждений. Там, где заданий было
        мало, так и указано: «недостаточно данных». Это нормально на старте — карта уточнится по ходу практики.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {competencies.map((c) => (
          <Card key={c.key}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: T.ink }}>{c.label}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkFaint, marginTop: 4 }}>
                  {c.evidence} заданий · уверенность оценки: {c.confidence}
                </div>
              </div>
              <Pill tone={c.level === "недостаточно данных" ? "neutral" : c.level === "начальный" ? "berry" : c.level === "базовый" ? "gold" : "teal"}>{c.level}</Pill>
            </div>
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom: 20, background: T.surfaceSoft, border: "none" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Info size={16} color={T.inkFaint} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkFaint, margin: 0, lineHeight: 1.6 }}>
            Часть C сохранена как первое свидетельство в вашем портфолио — её содержательную проверку
            даст ИИ-наставник внутри первого модуля.
          </p>
        </div>
      </Card>
      <button onClick={onFinish} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
        Перейти к обучению <ArrowRight size={15} />
      </button>
    </div>
  );
}

function Onboard_Diagnostic_Flow({ onComplete }) {
  const [stage, setStage] = useState("intro"); // intro | run | results
  const [competencies, setCompetencies] = useState(null);
  const [rawDiag, setRawDiag] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 620 }}>
        {stage === "intro" && <DiagnosticIntro onStart={() => setStage("run")} />}
        {stage === "run" && (
          <DiagnosticRunner onDone={(diag) => {
            setRawDiag(diag);
            setCompetencies(computeCompetencyProfile(diag));
            setStage("results");
          }} />
        )}
        {stage === "results" && competencies && (
          <DiagnosticResults competencies={competencies} onFinish={() => onComplete({ competencies, rawDiag })} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   МОДУЛЬ 1 — полное содержание уроков 1–8 по единому
   академическому стандарту BIOCARD Marketing Academy.
   ============================================================ */

const MODULE1_LESSON_META = [
  { id: 1, title: "Возникновение маркетинга", question: "Почему бизнесу стало недостаточно производить и продавать?", duration: "≈ 45 мин", built: true },
  { id: 2, title: "Эволюция маркетинговых концепций", question: "Как менялась ориентация компании при принятии решений?", duration: "≈ 50 мин", built: true },
  { id: 3, title: "Что такое современный маркетинг", question: "Что входит в маркетинг сегодня?", duration: "≈ 35 мин", built: true,
    results: ["Сопоставлять несколько признанных определений маркетинга", "Различать задачи и функции маркетинга", "Объяснять маркетинг руководителю без сведения к каналам"] },
  { id: 4, title: "Маркетинг в системе бизнеса", question: "Где заканчивается маркетинг и начинается работа других функций?", duration: "≈ 35 мин", built: true,
    results: ["Карта взаимодействия с продажами, продуктом, PR, HR, логистикой и финансами", "Различение маркетинга и смежных функций на практике"] },
  { id: 5, title: "Базовые понятия маркетинга", question: "Что именно создаёт и оценивает клиент?", duration: "≈ 30 мин", built: true,
    results: ["Точное использование потребности, желания, спроса, ценности, удовлетворённости, лояльности"] },
  { id: 6, title: "Базовые модели: вводный уровень", question: "Какая модель отвечает на какой вопрос?", duration: "≈ 30 мин", built: true,
    results: ["Узнавание STP, 4P/7P, AIDA, Customer Journey, воронки", "Понимание ограничений каждой модели"] },
  { id: 7, title: "Современные направления", question: "Что меняется, а что остаётся фундаментом?", duration: "≈ 30 мин", built: true,
    results: ["Различение устойчивых принципов и актуальных платформенных практик"] },
  { id: 8, title: "Интеграция и итоговая работа", question: "Как увидеть маркетинг как систему?", duration: "≈ 60 мин", built: true,
    results: ["Аналитический разбор реальной или учебной компании", "Диагностика проблемы вместо преждевременного выбора инструмента"] },
];

const LESSON_CONTENT = {
  1: {
    place: "Урок 1 из 8 · открывает модуль «Основы современного маркетинга»",
    prereq: "Предварительные знания не требуются",
    results: [
      "Объяснить, почему маркетинговые практики нельзя привязать к одной дате или одной стране",
      "Показать связь между развитием массового производства, распределения, конкуренции и исследования рынка",
      "Отличить наличие торговли и продвижения от маркетинга как оформленной управленческой дисциплины",
    ],
    problemInput: "Небольшая пекарня, где владелец лично знает каждого покупателя, открывает третью точку и перестаёт успевать. Что из «маркетинга» ей внезапно становится нужно — и почему раньше можно было без этого обходиться?",
    theory: [
      { label: "Маркетинговые практики существовали до маркетинга как дисциплины", text: "Обмен, репутация продавца, упаковка, ярмарки, рекомендации и адаптация товара к спросу существовали задолго до XX века. Некорректно говорить, что «до индустриальной эпохи бизнес работал без маркетинга» — меняется не наличие обмена, а системность и роль маркетинга в управлении организацией." },
      { label: "Индустриализация и масштабирование", text: "Рост производительности, транспортной инфраструктуры и массового распределения увеличил расстояние между производителем и покупателем. Компании стали работать с более крупными и неоднородными рынками, где личного знания каждого клиента уже недостаточно." },
      { label: "Конкуренция и неопределённость спроса", text: "Когда организация не может автоматически реализовать весь объём предложения, ей нужно оценивать спрос, различать покупателей, выбирать каналы, управлять ценой и сообщением. Маркетинг возникает как набор функций координации рынка, а затем — как самостоятельная область управления." },
      { label: "Формирование академической дисциплины", text: "В начале XX века в университетах США стали появляться курсы по распределению, торговле и маркетингу. Это не значит, что маркетинг «изобрели» в этот момент — произошло оформление разрозненных практик в систематическую дисциплину." },
    ],
    limitations: "Схема «сначала дефицит, затем избыток предложения, затем маркетинг» полезна как упрощение, но не универсальный закон: на одном рынке одновременно могут существовать дефицит, жёсткая конкуренция и разные управленческие ориентации — а в разных странах и отраслях этот переход происходил не синхронно.",
    terms: [
      { term: "Маркетинговая практика", def: "Отдельное действие — адаптация товара, ценообразование, работа с репутацией — существовавшее и до оформления маркетинга как дисциплины" },
      { term: "Маркетинг как дисциплина", def: "Систематизированная область управления, оформившаяся в начале XX века как ответ на рост и усложнение рынков" },
      { term: "Неопределённость спроса", def: "Ситуация, при которой компания не может заранее знать, будет ли реализован весь объём предложения" },
    ],
    comparison: {
      title: "Маркетинговые практики vs маркетинг как дисциплина",
      rows: [
        ["Что это", "Отдельные приёмы — торг, репутация, адаптация под спрос", "Систематизированная область управления компанией"],
        ["Когда есть", "Практически в любой торговле, включая доиндустриальную", "Оформляется с ростом масштаба и неоднородности рынка"],
        ["Риск путаницы", "Считать, что раз приёмы были всегда — «маркетинг был всегда»", "Считать, что дисциплина возникла в один день с одним изобретателем"],
      ],
    },
    examples: {
      neutral: "Небольшая пекарня может знать постоянных покупателей лично. При расширении в сеть ей нужны данные о покупателях, стандарты продукта, сегментация спроса и единая коммуникация вместо личного знания каждого клиента.",
      b2b: "Поставщик логистических услуг не может ограничиться перечислением видов транспорта. Ему нужно понимать критерии разных участников закупки: сроки, сохранность груза, документы, риски, интеграцию с процессами клиента и полную стоимость владения.",
      personal: "Учебный смоделированный кейс BIOCARD: коммуникация о надёжности фармацевтической логистики убеждает не за счёт эпитетов о качестве, а когда она явно связана с реальными процессами контроля, сроками и требованиями клиентов — иначе это отдельный рекламный тезис, оторванный от процесса.",
    },
    mistakes: [
      "Утверждать, что маркетинг появился только после рекламы или социальных сетей",
      "Описывать историю как единую последовательность, одинаковую для всех отраслей и стран",
      "Считать, что при высоком спросе маркетинг совсем не нужен — выбор продукта, цены, распределения и отношений остаётся всегда",
    ],
    microcheck: { q: "Что именно появляется как ответ на рост рынков и рост неопределённости спроса — а не сам факт продажи товара?", a: "Системная координация решений о клиенте и оформленная управленческая дисциплина, а не отдельные разрозненные приёмы продвижения." },
    practice: {
      micro: "Назовите три изменения, которые происходят с коммуникацией компании при переходе от локальной работы к масштабированию.",
      main: "Опишите, какие маркетинговые функции требуются фармацевтической логистической компании помимо продвижения.",
      advanced: "Сравните две ситуации: дефицит критически важного товара и насыщенный рынок услуг. Какие задачи маркетинга сохраняются в обеих, а какие меняются?",
    },
    reflection: "Что изменилось в вашем понимании маркетинга после этого урока? Где в вашей работе на этой неделе вы могли бы применить различие между «отдельной практикой» и «системным подходом»?",
    summary: [
      "Маркетинговые практики старше маркетинга как дисциплины — путать одно с другим не стоит",
      "Маркетинг оформляется как ответ на масштаб, неоднородность рынка и неопределённость спроса",
      "Линейная история концепций — полезное упрощение, а не универсальный закон для всех рынков",
      "Даже при высоком спросе задачи выбора продукта, цены и отношений с клиентом никуда не исчезают",
    ],
    sources: {
      required: ["Kotler P., Keller K. L. — Marketing Management", "American Marketing Association — материалы по истории и определению маркетинга"],
      additional: ["Bartels R. — The History of Marketing Thought", "Jones D. G. B., Monieson D. D. — Early Development of the Philosophy of Marketing Thought"],
    },
    quiz: [
      { q: "Можно ли сказать, что до появления маркетинга как дисциплины бизнес работал «без маркетинга»?", type: "single",
        options: [
          { t: "Нет — элементы обмена, репутации и адаптации к спросу существовали и раньше; изменилась системность и роль маркетинга в управлении", correct: true },
          { t: "Да, до XX века никакого учёта покупателя не было" }, { t: "Да, потому что не было рекламы" },
          { t: "Нет, потому что торговля и маркетинг — всегда было одно и то же понятие" },
        ],
        explain: "Меняется не факт обмена, а его системность и место в управлении организацией." },
      { q: "Небольшая пекарня расширяется в сеть и теряет личное знание каждого покупателя. Какая задача возникает в первую очередь?", type: "case",
        options: [
          { t: "Как можно быстрее увеличить рекламный бюджет" },
          { t: "Нужны данные о покупателях, сегментация спроса и единая коммуникация вместо личного знания клиентов", correct: true },
          { t: "Закрыть часть точек, чтобы вернуть личное знание клиентов" }, { t: "Ничего менять не нужно, масштаб не влияет на маркетинг" },
        ],
        explain: "Именно потеря личного контакта с каждым клиентом создаёт потребность в системной координации." },
      { q: "Какие утверждения о схеме «дефицит → избыток → маркетинг» верны?", type: "multi",
        options: [
          { t: "Она полезна как упрощение", correct: true }, { t: "Она является универсальным законом для всех рынков и стран" },
          { t: "На одном рынке могут одновременно существовать дефицит и разные ориентации компаний", correct: true },
          { t: "Она точно определяет год возникновения маркетинга в любой отрасли" },
        ],
        explain: "Схема — рабочее упрощение, а не строгий универсальный закон, действующий одинаково везде." },
      { q: "Коммуникация о надёжности фармацевтической логистики будет убедительнее, если она:", type: "single",
        options: [
          { t: "Использует как можно больше эмоциональных эпитетов о качестве" },
          { t: "Связана с реальными процессами контроля, сроками и требованиями клиентов, а не существует как отдельный рекламный тезис", correct: true },
          { t: "Копирует формулировки конкурентов" }, { t: "Избегает конкретики, чтобы не раскрывать детали процессов" },
        ],
        explain: "Доверие в B2B/фарма-контексте строится на связи сообщения с реальным процессом, а не на эпитетах." },
      { q: "Поставщик логистических услуг ограничивается перечислением видов транспорта в материалах. Какой вероятный разрыв?", type: "case",
        options: [
          { t: "Он не учитывает реальные критерии участников закупки — сроки, сохранность, документы, риски, стоимость владения", correct: true },
          { t: "Ему просто нужно снизить цену" }, { t: "Ему нужно больше рекламных каналов" },
          { t: "Разрыва нет, перечисление транспорта — достаточная коммуникация для B2B" },
        ],
        explain: "B2B-решение почти всегда завязано на нескольких критериях, а не только на факте наличия транспорта." },
    ],
  },
  2: {
    place: "Урок 2 из 8 · продолжает модуль и выравнивает управленческие подходы",
    prereq: "Урок 1: Возникновение маркетинга",
    results: [
      "Различать производственную, товарную, сбытовую и маркетинговую ориентации",
      "Объяснять сильные стороны и риски каждой ориентации",
      "Распознавать маркетинговую близорукость — концентрацию на продукте вместо задачи клиента",
      "Понимать на вводном уровне маркетинг отношений, холистический и социально ответственный маркетинг",
    ],
    problemInput: "Отдел разработки гордится техническими характеристиками продукта, но продажи падают вопреки этому. Клиенты уходят к конкурентам с более простым продуктом. В какой управленческой логике застряла компания?",
    theory: [
      { label: "Производственная ориентация", text: "Приоритет получают эффективность, доступность и масштаб. Такая ориентация может быть рациональной при ограниченной доступности продукта или высокой чувствительности к цене. Риск — игнорирование изменения потребностей и качества опыта клиента." },
      { label: "Товарная ориентация", text: "Компания делает ставку на характеристики, качество и совершенствование продукта. Риск — предположение, что техническое превосходство автоматически создаёт предпочтение покупателя." },
      { label: "Сбытовая ориентация", text: "Внимание сосредоточено на стимулировании сделки и активных продажах. Может быть необходима для сложных или незнакомых продуктов, но становится проблемой, если заменяет работу с ценностью и продуктом." },
      { label: "Маркетинговая ориентация", text: "Организация изучает рынок, выбирает аудиторию, создаёт ценность и координирует функции ради удовлетворения клиента и целей бизнеса. Это не означает безусловное исполнение любого пожелания клиента." },
      { label: "Маркетинговая близорукость", text: "Теодор Левитт показал риск определения бизнеса через текущий продукт, а не через потребность клиента. Компания может улучшать продукт, который постепенно теряет значимость для реальной задачи клиента." },
      { label: "Маркетинг отношений и холистический подход", text: "Маркетинг отношений переносит внимание с отдельной сделки на долгосрочное взаимодействие. Холистический маркетинг подчёркивает связь внутреннего, интегрированного и социально ответственного маркетинга с управлением отношениями." },
    ],
    limitations: "Ориентации — не жёсткие исторические стадии, после которых предыдущая исчезает полностью: компания может быть одновременно эффективной в производстве и рыночно ориентированной. Проблема не в самой эффективности, а в превращении одного критерия в единственный при принятии решений.",
    terms: [
      { term: "Маркетинговая близорукость", def: "Определение бизнеса через текущий продукт вместо потребности клиента, из-за чего компания рискует не заметить, что задача клиента решается иначе" },
      { term: "Маркетинг отношений", def: "Подход, смещающий фокус с разовой сделки на выстраивание долгосрочной связи с клиентом" },
      { term: "Холистический маркетинг", def: "Подход, объединяющий внутренний, интегрированный и социально ответственный маркетинг с управлением отношениями в единую систему" },
    ],
    comparison: {
      title: "Четыре управленческие ориентации",
      header: ["Ориентация", "Фокус", "Риск"],
      rows: [
        ["Производственная", "Эффективность, доступность, масштаб", "Игнорирование меняющихся потребностей и опыта клиента"],
        ["Товарная", "Характеристики и качество продукта", "Вера, что превосходство продукта само создаёт спрос"],
        ["Сбытовая", "Стимулирование сделки, активные продажи", "Подмена работы с ценностью давлением на покупку"],
        ["Маркетинговая", "Ценность для выбранной аудитории", "Ошибочно трактуется как «клиент всегда прав»"],
      ],
    },
    examples: {
      neutral: "Учебный смоделированный кейс: компания одновременно эффективна в производстве и ориентирована на рынок. Проблема возникает не в самой эффективности, а в её превращении в единственный критерий при принятии решений.",
      b2b: "Поставщик продаёт «складские услуги», хотя клиент фактически покупает снижение риска срыва поставок, прозрачность процессов и соответствие требованиям — сообщение описывает функцию, а не решаемую задачу.",
      personal: "Учебный смоделированный кейс BIOCARD (внутренние коммуникации): сбытовая логика внутри компании проявляется, когда сотрудникам пытаются «продать» организационное изменение красивым сообщением, не меняя сам процесс и не объясняя причины.",
    },
    mistakes: [
      "Считать ориентации жёсткими историческими стадиями, после которых предыдущие полностью исчезают",
      "Считать маркетинговую ориентацию принципом «клиент всегда прав»",
      "Путать социальную ответственность с отдельной благотворительной публикацией",
    ],
    microcheck: { q: "Чем маркетинговая близорукость отличается от простого технического консерватизма?", a: "Это не просто нежелание менять продукт, а определение всего бизнеса через текущий продукт вместо реальной задачи клиента — компания может активно улучшать продукт и всё равно потерять связь с потребностью." },
    practice: {
      micro: "По одному признаку распознайте каждую из четырёх ориентаций в коротких ситуациях из вашей практики.",
      main: "Определите доминирующую ориентацию вашей компании на конкретном примере решения, а не по декларациям.",
      advanced: "Предложите, как сохранить производственную эффективность и одновременно усилить рыночную ориентацию — без выбора «или-или».",
    },
    reflection: "В какой из четырёх ориентаций чаще всего действует ваша команда при принятии решений — и совпадает ли это с тем, как вы хотели бы, чтобы она действовала?",
    summary: [
      "Четыре ориентации — не строгие исторические эпохи, а логики решений, которые могут сосуществовать",
      "Проблема производственной и товарной логики — не в эффективности или качестве самих по себе, а в их абсолютизации",
      "Маркетинговая близорукость — это про определение бизнеса через продукт, а не про нежелание его менять",
      "Маркетинговая ориентация не означает автоматическое согласие с любым пожеланием клиента",
    ],
    sources: {
      required: ["Levitt T. — Marketing Myopia, Harvard Business Review", "Kotler P., Keller K. L. — Marketing Management"],
      additional: ["Kohli A. K., Jaworski B. J. — Market Orientation: The Construct, Research Propositions, and Managerial Implications", "Narver J. C., Slater S. F. — The Effect of a Market Orientation on Business Profitability"],
    },
    quiz: [
      { q: "Компания одновременно эффективна в производстве и ориентирована на рынок. В чём тогда может быть проблема?", type: "single",
        options: [ { t: "Такого сочетания не бывает" }, { t: "Проблема не в эффективности, а в превращении её в единственный критерий решений", correct: true },
          { t: "Проблема в том, что маркетинговая ориентация всегда противоречит эффективности" }, { t: "Проблема в том, что нужно полностью отказаться от контроля издержек" } ],
        explain: "Ориентации могут сочетаться — риск в абсолютизации одного критерия." },
      { q: "Поставщик продаёт «складские услуги», хотя клиент хочет снижения риска срыва поставок и соответствия требованиям. Это пример:", type: "case",
        options: [ { t: "Логики, при которой сообщение описывает функцию, а не решаемую задачу клиента — признак маркетинговой близорукости", correct: true },
          { t: "Правильно выстроенного маркетингового сообщения" }, { t: "Излишней клиентоориентированности" }, { t: "Проблемы ценообразования" } ],
        explain: "Классический случай близорукости по Левитту — фокус на продукте/функции вместо задачи клиента." },
      { q: "Что из перечисленного — признаки маркетинговой близорукости по Левитту?", type: "multi",
        options: [ { t: "Определение бизнеса через текущий продукт, а не через задачу клиента", correct: true },
          { t: "Улучшение продукта, который постепенно теряет значимость для клиента", correct: true },
          { t: "Постоянная проверка, решает ли продукт актуальную задачу клиента" }, { t: "Ориентация на канал коммуникации вместо ориентации на цель" } ],
        explain: "Оба верных варианта описывают саму суть близорукости; проверка актуальности задачи — как раз противоядие от неё." },
      { q: "Сотрудникам «продают» изменение красивым сообщением, не меняя процесс и не объясняя причины. Какая логика применена ошибочно?", type: "case",
        options: [ { t: "Маркетинговая ориентация" }, { t: "Сбытовая логика, перенесённая на внутренние коммуникации — упор на убеждение вместо решения причины", correct: true },
          { t: "Холистический маркетинг" }, { t: "Товарная ориентация" } ],
        explain: "Это сбытовая логика: давление и убеждение вместо изменения сути и объяснения причин." },
      { q: "Реальная социальная ответственность отличается от разовой благотворительной публикации тем, что:", type: "single",
        options: [ { t: "Она заметна только в одном посте раз в год" }, { t: "Она отражается в устойчивых практиках компании, а не только в отдельном сообщении", correct: true },
          { t: "Она не требует никаких изменений в процессах" }, { t: "Она всегда важнее финансовых показателей компании" } ],
        explain: "Ключевое отличие — устойчивость практик, а не факт единичной публикации." },
    ],
  },
  3: {
    place: "Урок 3 из 8 · формирует современное рабочее определение маркетинга",
    prereq: "Уроки 1–2: возникновение маркетинга и управленческие ориентации",
    results: [
      "Сопоставлять несколько признанных определений маркетинга и видеть различия между ними",
      "Объяснять маркетинг как систему создания, коммуникации, доставки и обмена ценностью",
      "Различать стратегический, аналитический и операционный уровни маркетинговой работы",
      "Объяснять роль маркетинга руководителю без сведения к рекламе, контенту и каналам",
    ],
    problemInput: "Руководитель говорит: «Маркетинг должен делать посты, рекламу и мероприятия». При этом не определены аудитория, задача клиента, ценностное предложение, связь с продуктом и критерий результата. Является ли такой запрос маркетинговой задачей — и что нужно прояснить до выбора инструментов?",
    theory: [
      { label: "Определение AMA: ценность и обмен", text: "Американская ассоциация маркетинга описывает маркетинг как деятельность, систему институтов и процессы создания, коммуникации, доставки и обмена предложениями, которые имеют ценность для клиентов, партнёров и общества. Важный акцент здесь — маркетинг не ограничивается продвижением и не заканчивается в момент продажи." },
      { label: "Управленческий взгляд Котлера", text: "В управленческой традиции маркетинг связан с выявлением и удовлетворением потребностей через создание ценности. Это требует выбора рынка, понимания аудитории, разработки предложения, координации цены, каналов и коммуникации, а затем оценки результата." },
      { label: "Друкер: маркетинг шире отдела маркетинга", text: "Питер Друкер подчёркивал, что смысл маркетинга — настолько хорошо понять клиента, чтобы продукт или услуга соответствовали его задаче. Этот тезис не означает, что продажи исчезают, но показывает: маркетинг начинается раньше рекламной кампании и влияет на решения всей компании." },
      { label: "Маркетинг как система, а не набор инструментов", text: "Системный маркетинг связывает исследование рынка, сегментацию, выбор аудитории, позиционирование, продукт, цену, каналы, коммуникацию, клиентский опыт и измерение результата. Пост, ролик или рекламная кампания — только отдельные инструменты внутри этой системы." },
      { label: "Ценность создаётся не одним отделом", text: "Маркетинг может сформулировать обещание и помочь понять ожидания рынка, но фактическую ценность создают совместно продукт, сервис, продажи, логистика, поддержка и другие функции. Если операционный процесс не выполняет обещание, коммуникация не превращает его в ценность." },
      { label: "Три уровня маркетинговой работы", text: "Стратегический уровень отвечает на вопросы: где конкурируем, для кого работаем и какое место хотим занять. Аналитический уровень исследует рынок, поведение, барьеры и результаты. Операционный уровень реализует решения через кампании, контент, мероприятия, каналы и конкретные механики." },
      { label: "Маркетинг работает с обменом и отношениями", text: "Современный маркетинг не ограничивается привлечением и разовой сделкой. Он влияет на ожидания, опыт, удержание, репутацию и долгосрочные отношения с клиентами, партнёрами, сотрудниками и другими заинтересованными сторонами." },
    ],
    limitations: "Ни одно определение маркетинга не охватывает все отраслевые и организационные особенности. Определения AMA, Котлера и Друкера расставляют разные акценты, но не противоречат друг другу полностью. Рабочее определение полезно, если помогает диагностировать задачу и принимать решения, а не превращается в спор о единственно правильной формулировке.",
    terms: [
      { term: "Ценность", def: "Воспринимаемый клиентом баланс выгод, затрат, усилий, времени, рисков и доступных альтернатив" },
      { term: "Ценностное предложение", def: "Обоснованное объяснение, для кого, какую задачу и почему лучше альтернатив решает предложение" },
      { term: "Обмен", def: "Получение желаемой ценности в ответ на предоставление другой ценности — денег, времени, данных, внимания, обязательств или иных ресурсов" },
      { term: "Маркетинговая система", def: "Связь исследования, стратегии, продукта, цены, каналов, коммуникации, опыта клиента и измерения результата" },
    ],
    comparison: {
      title: "Разные взгляды на современный маркетинг",
      header: ["Подход", "Главный акцент", "Что помогает увидеть", "Риск упрощения"],
      rows: [
        ["AMA", "Создание, коммуникация, доставка и обмен ценностью", "Маркетинг как процесс для клиентов, партнёров и общества", "Прочитать определение формально, не связав его с решениями"],
        ["Котлер и Келлер", "Выявление и удовлетворение потребностей через ценность", "Управленческую связь рынка, предложения и результата", "Свести потребности к буквальным пожеланиям клиента"],
        ["Друкер", "Понимание клиента и соответствие продукта его задаче", "Маркетинг как логику всего бизнеса, а не одного отдела", "Ошибочно решить, что продажи и продвижение больше не нужны"],
        ["Инструментальный взгляд", "Посты, реклама, мероприятия, каналы", "Конкретные способы реализации", "Начать с инструмента и потерять задачу, аудиторию и ценность"],
      ],
    },
    examples: {
      neutral: "Кафе не начинает маркетинговую работу с выбора социальной сети. Сначала оно определяет, кого хочет привлечь, в какой ситуации человек выбирает заведение, какие альтернативы рассматривает и чем предложение будет для него ценнее.",
      b2b: "Для B2B-клиента ценность логистического партнёра может заключаться не в самом факте перевозки, а в предсказуемости сроков, корректности документов, снижении риска, прозрачности статуса груза и сокращении внутренних трудозатрат клиента.",
      personal: "Учебный кейс BIOCARD: публикация истории сотрудника может поддерживать HR-бренд, внутреннюю вовлечённость и узнаваемость компании. Но она становится маркетинговым инструментом только тогда, когда определены аудитория, задача, ожидаемое изменение и критерий результата.",
    },
    mistakes: [
      "Начинать обсуждение с формата, площадки или частоты публикаций до определения задачи и аудитории",
      "Считать маркетинг подразделением, которое отвечает только за внешние сообщения и оформление",
      "Обещать в коммуникации то, что продукт, сервис или операционный процесс не способны обеспечить",
      "Оценивать маркетинг только по количеству материалов, охватам или активности команды",
      "Понимать клиентоориентированность как безусловное выполнение любого пожелания клиента",
    ],
    microcheck: { q: "Почему наличие рекламной кампании ещё не доказывает, что компания занимается маркетингом системно?", a: "Потому что реклама может быть изолированной активностью. Для системного маркетинга нужны выбранная аудитория, понятная задача клиента, ценностное предложение, связь с продуктом и процессом, а также измеримый результат." },
    practice: {
      micro: "Переформулируйте запрос «нам нужно больше постов» в пять диагностических вопросов: об аудитории, задаче, ценности, ожидаемом действии и метрике.",
      main: "Выберите одну рабочую активность и разложите её как маркетинговую систему: бизнес-цель, аудитория, ситуация выбора, задача клиента, ценностное предложение, доказательство, канал, ожидаемое действие и показатель результата.",
      advanced: "Найдите реальный или учебный пример разрыва между обещанием в коммуникации и фактическим опытом. Определите источник разрыва и предложите три варианта: изменить сообщение, изменить процесс или синхронно изменить оба элемента.",
    },
    reflection: "Какую часть маркетинговой системы ваша команда чаще всего пропускает: исследование, выбор аудитории, формулировку ценности, согласование с операциями или измерение результата? К каким последствиям это приводит?",
    summary: [
      "Современный маркетинг — это система создания, коммуникации, доставки и обмена ценностью, а не синоним рекламы",
      "Определения AMA, Котлера и Друкера различаются акцентами, но сходятся в центральной роли клиента, ценности и управленческих решений",
      "Маркетинг начинается до выбора канала и продолжается после первой сделки",
      "Стратегические, аналитические и операционные задачи связаны, но не взаимозаменяемы",
      "Фактическую ценность создаёт вся компания, поэтому коммуникация должна соответствовать продукту и процессам",
    ],
    sources: {
      required: ["American Marketing Association — Definition of Marketing", "Kotler P., Keller K. L. — Marketing Management", "Drucker P. — The Practice of Management"],
      additional: ["Vargo S. L., Lusch R. F. — Evolving to a New Dominant Logic for Marketing", "Grönroos C. — Service Management and Marketing"],
    },
    quiz: [
      { q: "Какое описание точнее всего отражает современный маркетинг?", type: "single",
        options: [
          { t: "Создание публикаций, рекламы и мероприятий" },
          { t: "Система решений о рынке, аудитории, ценности, предложении, коммуникации, доставке и результате", correct: true },
          { t: "Любая деятельность, которая помогает увеличить охват" },
          { t: "Работа отдела, который оформляет сообщения компании" },
        ],
        explain: "Инструменты входят в маркетинг, но не исчерпывают его. Центральна система взаимосвязанных решений." },
      { q: "Руководитель просит «запустить рекламу». Какие вопросы нужно прояснить до выбора канала?", type: "multi",
        options: [
          { t: "Какую бизнес-задачу решаем?", correct: true },
          { t: "Для какой аудитории и ситуации выбора?", correct: true },
          { t: "Какую ценность и ожидаемое действие предлагаем?", correct: true },
          { t: "Какой формат лично нравится руководителю?" },
        ],
        explain: "Выбор инструмента должен следовать за задачей, аудиторией, ценностью и ожидаемым поведением." },
      { q: "Компания обещает клиенту полную прозрачность доставки, но статус груза обновляется с задержкой. Какой вывод наиболее точный?", type: "case",
        options: [
          { t: "Нужно сильнее повторять обещание в рекламе" },
          { t: "Есть разрыв между ценностным предложением и операционным процессом; нужно согласовать сообщение и исправление процесса", correct: true },
          { t: "Проблема решается увеличением количества публикаций" },
          { t: "Это исключительно задача отдела продаж" },
        ],
        explain: "Коммуникация не создаёт ценность, если компания не способна выполнить обещание." },
      { q: "Какие задачи относятся к стратегическому уровню маркетинга?", type: "multi",
        options: [
          { t: "Выбор целевого сегмента", correct: true },
          { t: "Формирование позиционирования", correct: true },
          { t: "Монтаж конкретного ролика" },
          { t: "Выбор приоритетного рынка", correct: true },
        ],
        explain: "Стратегический уровень задаёт направление: где, для кого и с каким отличием работает компания." },
      { q: "Публикация истории сотрудника получила высокий охват. Можно ли считать маркетинговую задачу выполненной?", type: "case",
        options: [
          { t: "Да, высокий охват всегда означает успех" },
          { t: "Только если охват был заранее определён как целевой результат; иначе нужно оценивать изменение нужного поведения или восприятия", correct: true },
          { t: "Да, если публикация была визуально качественной" },
          { t: "Нет, охват никогда не имеет значения" },
        ],
        explain: "Метрика имеет смысл только в связи с исходной задачей и ожидаемым результатом." },
      { q: "Какой тезис лучше всего отражает взгляд Друкера на маркетинг?", type: "single",
        options: [
          { t: "Маркетинг нужен только после создания продукта" },
          { t: "Маркетинг должен помогать компании настолько хорошо понять клиента, чтобы предложение соответствовало его задаче", correct: true },
          { t: "Маркетинг — это другое название активных продаж" },
          { t: "Маркетинг полностью заменяет продажи" },
        ],
        explain: "Друкер расширяет маркетинг до логики понимания клиента и соответствия предложения его задаче." },
    ],
  },
  4: {
    place: "Урок 4 из 8 · показывает место маркетинга в системе бизнеса",
    prereq: "Урок 3: современный маркетинг как система",
    results: ["Разделять ответственность маркетинга и смежных функций", "Строить карту взаимодействия вокруг клиентской задачи", "Выявлять организационные разрывы, которые нельзя решить коммуникацией"],
    problemInput: "Продажи считают, что маркетинг даёт слабые лиды; маркетинг считает, что продажи плохо обрабатывают обращения. Как перейти от взаимных обвинений к диагностике процесса?",
    theory: [
      { label: "Маркетинг и продажи", text: "Маркетинг формирует понимание рынка, спрос, ценностное предложение и условия появления качественного интереса. Продажи ведут конкретную возможность к сделке. Граница зависит от модели бизнеса, но критерии передачи должны быть согласованы." },
      { label: "Маркетинг и продукт", text: "Маркетинг приносит данные о задачах, выборе и опыте клиентов; продуктовая функция превращает их в решения. Ни одна сторона не должна единолично подменять другую." },
      { label: "Маркетинг, PR и коммуникации", text: "Маркетинг чаще связан с выбранными аудиториями и рыночным результатом, PR — с отношениями и репутацией среди более широкого круга стейкхолдеров. На практике функции пересекаются и требуют общей архитектуры сообщений." },
      { label: "Операции и финансы", text: "Маркетинговое обещание должно быть операционно выполнимым и экономически обоснованным. Поэтому логистика, сервис, юридическая функция и финансы участвуют в создании ценности, даже если не называются маркетингом." },
    ],
    limitations: "Универсальной организационной схемы нет. В небольшой компании один человек может выполнять несколько ролей, а в крупной — одна функция распределена между подразделениями. Важно не название отдела, а ясность ответственности и передачи работы.",
    terms: [
      { term: "Стейкхолдер", def: "Человек или группа, влияющая на решение компании или испытывающая последствия этого решения" },
      { term: "SLA передачи", def: "Согласованные критерии качества, срока и ответственности при передаче работы между функциями" },
      { term: "Сквозной процесс", def: "Последовательность действий нескольких подразделений, ведущая к общему результату для клиента и бизнеса" },
    ],
    comparison: { title: "Зоны ответственности", header: ["Функция", "Основной вклад", "Риск разрыва"], rows: [["Маркетинг", "Рынок, аудитория, ценность, спрос", "Обещание без связи с продуктом"], ["Продажи", "Диалог и сделка", "Потеря или неверная квалификация обращений"], ["Продукт/операции", "Фактическое выполнение обещания", "Несоответствие опыта коммуникации"], ["Финансы", "Экономическая устойчивость", "Активность без окупаемости или приоритета"]] },
    examples: { neutral: "В онлайн-сервисе маркетинг привлекает пользователя обещанием простоты, продукт сокращает путь регистрации, поддержка помогает завершить действие, а аналитика показывает потери на этапах.", b2b: "В логистике маркетинг не может гарантировать температурный режим без процессов склада, транспорта, контроля и документов.", personal: "Учебный кейс BIOCARD: вакансия формирует ожидание кандидата, но HR-бренд будет устойчивым только тогда, когда описание работы совпадает с реальным опытом сотрудника." },
    mistakes: ["Считать любой внешний текст исключительной ответственностью маркетинга", "Пытаться коммуникацией исправить системную проблему сервиса", "Не фиксировать критерии передачи обращений между маркетингом и продажами"],
    microcheck: { q: "Кто отвечает за ценностное предложение: маркетинг или продукт?", a: "Обычно это совместная ответственность: маркетинг приносит понимание рынка, а продукт и операции подтверждают, что обещание выполнимо." },
    practice: { micro: "Нарисуйте путь одной клиентской задачи через минимум три функции компании.", main: "Разберите один конфликт между подразделениями через вход, выход, критерий качества и владельца каждого этапа.", advanced: "Предложите короткий SLA передачи маркетингового обращения в продажи или HR." },
    reflection: "Какой межфункциональный разрыв сильнее всего влияет на качество вашей коммуникации?",
    summary: ["Маркетинг создаёт результат не изолированно, а внутри сквозного процесса", "Границы функций могут различаться, но ответственность должна быть ясной", "Коммуникация не заменяет исправление продукта или процесса", "Общий результат важнее локальных показателей отдела"],
    sources: { required: ["Kotler P., Keller K. L. — Marketing Management", "Porter M. — Competitive Advantage"], additional: ["Homburg C., Workman J. P., Krohmer H. — Marketing's Influence Within the Firm"] },
    quiz: [
      { q: "Что лучше всего помогает разобрать конфликт маркетинга и продаж?", type: "single", options: [{ t: "Увеличить план обоим отделам" }, { t: "Зафиксировать критерии качественного обращения, момент передачи и ответственность", correct: true }, { t: "Сменить CRM" }, { t: "Провести рекламную кампанию" }], explain: "Нужны общие критерии процесса, а не только локальные оценки." },
      { q: "Какие функции участвуют в создании клиентской ценности?", type: "multi", options: [{ t: "Маркетинг", correct: true }, { t: "Продукт и операции", correct: true }, { t: "Сервис", correct: true }, { t: "Только рекламный отдел" }], explain: "Ценность создаётся всей системой компании." },
      { q: "Компания обещает скорость, но задержки возникают на складе. Это прежде всего:", type: "case", options: [{ t: "Проблема шрифта" }, { t: "Разрыв между коммуникацией и операционным процессом", correct: true }, { t: "Недостаток публикаций" }, { t: "Неверный логотип" }], explain: "Маркетинговое обещание должно быть выполнимо операционно." },
      { q: "Что описывает сквозной процесс?", type: "single", options: [{ t: "Работу одного сотрудника" }, { t: "Связанную работу нескольких функций ради общего результата", correct: true }, { t: "Только рекламную воронку" }, { t: "Оргструктуру компании" }], explain: "Сквозной процесс проходит через границы подразделений." },
      { q: "Что является признаком здоровой границы функций?", type: "single", options: [{ t: "Каждый оптимизирует только свой KPI" }, { t: "Понятны вход, выход, критерий качества и владелец этапа", correct: true }, { t: "Все задачи выполняет маркетинг" }, { t: "Ответственность не фиксируется" }], explain: "Ясность передачи снижает потери и взаимные обвинения." },
    ],
  },
  5: {
    place: "Урок 5 из 8 · вводит базовый язык маркетинга",
    prereq: "Уроки 3–4: маркетинг как система и его место в бизнесе",
    results: ["Различать потребность, желание и спрос", "Оценивать ценность как баланс выгод и затрат", "Понимать связь удовлетворённости, повторного выбора и лояльности"],
    problemInput: "Клиент говорит, что ему нужна «быстрая доставка». Является ли это потребностью, желанием или критерием выбора — и почему различие важно?",
    theory: [
      { label: "Потребность, желание и спрос", text: "Потребность отражает базовую задачу или дефицит. Желание — конкретный способ её удовлетворения, сформированный контекстом и опытом. Спрос возникает, когда желание поддержано готовностью и возможностью совершить обмен." },
      { label: "Ценность и цена", text: "Цена — только одна часть затрат клиента. В ценность входят функциональные, эмоциональные и социальные выгоды, а в затраты — деньги, время, усилия, риски и стоимость переключения." },
      { label: "Удовлетворённость", text: "Она возникает из сравнения ожиданий и воспринимаемого опыта. Высокая удовлетворённость не всегда означает лояльность: клиент может быть доволен, но легко перейти к более удобной альтернативе." },
      { label: "Лояльность", text: "Лояльность проявляется в повторном выборе, предпочтении, готовности рекомендовать и устойчивости к альтернативам. Её нельзя надёжно измерять одним вопросом или одной покупкой." },
    ],
    limitations: "Термины помогают анализу, но реальный выбор редко подчиняется простой линейной схеме. Один человек может одновременно оценивать функциональную пользу, привычку, риск и мнение других людей.",
    terms: [
      { term: "Потребность", def: "Базовая задача, состояние или дефицит, который человек стремится изменить" },
      { term: "Спрос", def: "Желание, подкреплённое готовностью и возможностью совершить обмен" },
      { term: "Воспринимаемая ценность", def: "Субъективный баланс выгод и всех затрат относительно альтернатив" },
    ],
    comparison: { title: "Базовые понятия", header: ["Понятие", "Вопрос", "Пример"], rows: [["Потребность", "Какую базовую задачу решает человек?", "Получить лекарство вовремя"], ["Желание", "Каким способом он хочет решить задачу?", "Доставка в конкретный интервал"], ["Спрос", "Готов и способен ли он выбрать предложение?", "Есть бюджет и полномочия оформить заказ"], ["Ценность", "Почему это предложение лучше альтернатив?", "Ниже риск, меньше усилий, прозрачнее процесс"]] },
    examples: { neutral: "Покупатель выбирает не просто кофе, а удобный ритуал, вкус, скорость и атмосферу с учётом цены и расстояния.", b2b: "Закупщик оценивает не только тариф перевозки, но и вероятность срыва, трудозатраты на контроль, документы и последствия ошибки.", personal: "Учебный кейс BIOCARD: сотрудник может быть доволен отдельным корпоративным мероприятием, но лояльность зависит от более широкого опыта — руководства, процессов, развития и справедливости." },
    mistakes: ["Называть любой продукт потребностью клиента", "Сводить ценность к низкой цене", "Считать удовлетворённого клиента автоматически лояльным"],
    microcheck: { q: "Почему «клиенту нужна доставка» — недостаточно точная формулировка потребности?", a: "Доставка — способ решения. Базовая задача может быть в доступности товара, соблюдении срока, снижении риска или предсказуемости процесса." },
    practice: { micro: "Для одного продукта разделите потребность, желание и спрос.", main: "Составьте карту выгод и затрат клиента, включая время, усилия и риски.", advanced: "Предложите два способа повысить ценность без снижения цены." },
    reflection: "Какую скрытую стоимость — время, усилия или риск — ваша команда чаще всего недооценивает?",
    summary: ["Потребность не равна конкретному продукту", "Спрос требует готовности и возможности совершить обмен", "Ценность — это не только выгоды и не только цена", "Удовлетворённость и лояльность связаны, но не тождественны"],
    sources: { required: ["Kotler P., Keller K. L. — Marketing Management", "Zeithaml V. A. — Consumer Perceptions of Price, Quality, and Value"], additional: ["Oliver R. L. — Satisfaction: A Behavioral Perspective on the Consumer"] },
    quiz: [
      { q: "Что отличает спрос от желания?", type: "single", options: [{ t: "Наличие модного продукта" }, { t: "Готовность и возможность совершить обмен", correct: true }, { t: "Высокая известность бренда" }, { t: "Реклама" }], explain: "Спрос предполагает ресурс и готовность действовать." },
      { q: "Что входит в затраты клиента кроме цены?", type: "multi", options: [{ t: "Время", correct: true }, { t: "Усилия", correct: true }, { t: "Риск", correct: true }, { t: "Только скидка" }], explain: "Клиент оценивает полную стоимость выбора." },
      { q: "Довольный клиент обязательно лоялен?", type: "single", options: [{ t: "Да, всегда" }, { t: "Нет, он может перейти к более удобной альтернативе", correct: true }, { t: "Только в B2B" }, { t: "Только при низкой цене" }], explain: "Удовлетворённость не гарантирует устойчивого предпочтения." },
      { q: "Клиент выбирает более дорогого поставщика из-за меньшего риска срыва. Это пример:", type: "case", options: [{ t: "Иррационального выбора" }, { t: "Оценки общей воспринимаемой ценности", correct: true }, { t: "Отсутствия спроса" }, { t: "Только эмоциональной выгоды" }], explain: "Риск является частью полной стоимости и ценности." },
      { q: "Что является желанием, а не базовой потребностью?", type: "single", options: [{ t: "Снизить риск" }, { t: "Получить доставку в мобильном приложении в двухчасовой интервал", correct: true }, { t: "Обеспечить доступность товара" }, { t: "Избежать критической задержки" }], explain: "Конкретный формат решения — желание, а не базовая задача." },
    ],
  },
  6: {
    place: "Урок 6 из 8 · даёт карту базовых маркетинговых моделей",
    prereq: "Урок 5: базовые понятия маркетинга",
    results: ["Выбирать модель по вопросу, а не по популярности", "Различать STP, маркетинг-микс, AIDA, путь клиента и воронку", "Видеть ограничения упрощённых моделей"],
    problemInput: "Команда пытается описать весь маркетинг одной воронкой. Какие решения воронка помогает принять, а какие скрывает?",
    theory: [
      { label: "STP", text: "Сегментация, выбор целевого сегмента и позиционирование отвечают на вопросы: какие группы существуют, с кем работаем и какое место хотим занять в восприятии выбранной аудитории." },
      { label: "4P и 7P", text: "Маркетинг-микс помогает согласовать продукт, цену, распределение и продвижение; в услугах часто добавляют людей, процессы и физические свидетельства. Модель не заменяет исследование и стратегию." },
      { label: "AIDA и воронка", text: "AIDA описывает внимание, интерес, желание и действие как упрощённую коммуникационную логику. Воронка показывает потери между этапами, но может создавать ложное впечатление строго линейного поведения." },
      { label: "Customer Journey", text: "Карта пути клиента показывает ситуации, точки контакта, ожидания, эмоции и барьеры до, во время и после выбора. Она шире одной рекламной воронки и особенно полезна для межфункциональной работы." },
    ],
    limitations: "Модель — инструмент мышления, а не точная копия реальности. Чем проще модель, тем важнее явно указывать, что она не показывает: повторные циклы, влияние нескольких участников, случайность и внешние ограничения.",
    terms: [
      { term: "Сегментация", def: "Разделение рынка на группы со значимыми различиями для решения маркетинговой задачи" },
      { term: "Позиционирование", def: "Выбранное место предложения относительно альтернатив в восприятии целевой аудитории" },
      { term: "Точка контакта", def: "Любое взаимодействие, влияющее на ожидания или опыт человека на пути выбора" },
    ],
    comparison: { title: "Какая модель отвечает на какой вопрос", header: ["Модель", "Главный вопрос", "Ограничение"], rows: [["STP", "Для кого и с каким позиционированием?", "Не описывает исполнение всей стратегии"], ["4P/7P", "Какие элементы предложения согласовать?", "Может выглядеть как механический чек-лист"], ["AIDA/воронка", "Где теряется движение к действию?", "Упрощает нелинейное поведение"], ["Customer Journey", "Каков опыт на всём пути?", "Требует данных и совместной работы функций"]] },
    examples: { neutral: "Для нового курса STP помогает выбрать аудиторию, 4P — собрать предложение, воронка — увидеть потери регистрации, а карта пути — понять барьеры до и после обучения.", b2b: "В B2B решение могут принимать закупщик, пользователь, финансист и руководитель; одна линейная воронка не отражает все роли.", personal: "Учебный кейс BIOCARD: при продвижении вакансии AIDA помогает собрать объявление, но путь кандидата включает отклик, интервью, обратную связь, оффер и первые недели работы." },
    mistakes: ["Использовать популярную модель без сформулированного вопроса", "Считать путь клиента строго линейным", "Пытаться заменить исследование заполнением шаблона"],
    microcheck: { q: "Почему карта пути клиента не равна воронке?", a: "Воронка акцентирует переходы и потери, а карта пути — контекст, точки контакта, ожидания и опыт, включая этапы после действия." },
    practice: { micro: "Соотнесите четыре рабочие задачи с подходящей моделью.", main: "Выберите один кейс и примените две модели, объяснив, что каждая показывает и скрывает.", advanced: "Перестройте линейную воронку в карту пути с возвратами, несколькими ролями и этапом после покупки." },
    reflection: "Какую модель ваша команда использует по привычке, даже когда она плохо отвечает на вопрос?",
    summary: ["STP отвечает за выбор аудитории и позиционирование", "4P/7P помогает согласовать элементы предложения", "Воронка и AIDA полезны, но упрощают поведение", "Customer Journey связывает точки контакта и опыт по всему пути"],
    sources: { required: ["Kotler P., Keller K. L. — Marketing Management", "Lemon K. N., Verhoef P. C. — Understanding Customer Experience Throughout the Customer Journey"], additional: ["Strong E. K. — The Psychology of Selling and Advertising"] },
    quiz: [
      { q: "Какая модель отвечает на вопрос «для кого и с каким отличием работаем»?", type: "single", options: [{ t: "STP", correct: true }, { t: "AIDA" }, { t: "Только воронка" }, { t: "PEST" }], explain: "STP связывает сегментацию, выбор аудитории и позиционирование." },
      { q: "Что обычно добавляют в 7P по сравнению с 4P?", type: "multi", options: [{ t: "Люди", correct: true }, { t: "Процессы", correct: true }, { t: "Физические свидетельства", correct: true }, { t: "Только охваты" }], explain: "Расширение особенно полезно для услуг." },
      { q: "Главный риск линейной воронки:", type: "single", options: [{ t: "Она слишком дорогая" }, { t: "Она может скрывать возвраты, циклы и несколько участников решения", correct: true }, { t: "В ней нет цифр" }, { t: "Она подходит только дизайнерам" }], explain: "Реальное поведение часто нелинейно." },
      { q: "Для анализа опыта кандидата от объявления до адаптации лучше использовать:", type: "case", options: [{ t: "Только AIDA" }, { t: "Customer Journey", correct: true }, { t: "Только 4P" }, { t: "Логотип" }], explain: "Карта пути охватывает весь опыт и точки контакта." },
      { q: "Как правильно использовать маркетинговую модель?", type: "single", options: [{ t: "Как точное описание реальности" }, { t: "Как инструмент для конкретного вопроса с пониманием ограничений", correct: true }, { t: "Как замену исследованию" }, { t: "Как обязательный шаблон для любого проекта" }], explain: "Модель полезна только в связи с вопросом и контекстом." },
    ],
  },
  7: {
    place: "Урок 7 из 8 · связывает фундамент маркетинга с современными практиками",
    prereq: "Урок 6: базовые модели",
    results: ["Различать устойчивые принципы и временные инструменты", "Понимать роль данных, персонализации, сообществ и ИИ", "Оценивать новые практики через ценность, этику и измеримость"],
    problemInput: "Компания хочет внедрить ИИ, короткие видео и персонализацию одновременно. Как понять, что действительно решает задачу, а что является реакцией на тренд?",
    theory: [
      { label: "Данные и персонализация", text: "Данные помогают точнее понимать поведение и адаптировать опыт, но персонализация создаёт ценность только при релевантности, прозрачности и уважении к приватности." },
      { label: "Контент и сообщества", text: "Контент может обучать, снижать неопределённость и поддерживать отношения. Сообщество возникает не из частоты публикаций, а из устойчивого взаимодействия и общей ценности для участников." },
      { label: "Омниканальность", text: "Клиент воспринимает компанию целиком, а не по отдельным каналам. Омниканальность означает согласованность данных, сообщений и опыта, а не просто присутствие на многих площадках." },
      { label: "ИИ в маркетинге", text: "ИИ ускоряет анализ, создание вариантов и рутинные операции, но не снимает ответственность за данные, факты, стратегию, авторские права и последствия решения." },
    ],
    limitations: "Современность инструмента не доказывает его полезность. Платформы, алгоритмы и форматы быстро меняются, поэтому устойчивым критерием остаётся связь с задачей аудитории и измеримым результатом.",
    terms: [
      { term: "Омниканальность", def: "Согласованный опыт между каналами, в котором данные и контекст не теряются при переходе" },
      { term: "Персонализация", def: "Адаптация сообщения или опыта на основе релевантных данных о контексте и потребностях" },
      { term: "Human-in-the-loop", def: "Процесс, в котором человек проверяет, корректирует и несёт ответственность за результат работы ИИ" },
    ],
    comparison: { title: "Фундамент и инструменты", header: ["Уровень", "Что устойчиво", "Что меняется"], rows: [["Стратегия", "Аудитория, задача, ценность, отличие", "Методы исследования и анализа"], ["Коммуникация", "Ясность, релевантность, доказательность", "Форматы и платформы"], ["Измерение", "Связь метрики с целью", "Системы и способы атрибуции"], ["ИИ", "Ответственность и проверка", "Модели и интерфейсы"]] },
    examples: { neutral: "Короткое видео полезно не потому, что это тренд, а если выбранная аудитория потребляет такой формат и он помогает сделать нужное действие.", b2b: "Персонализированное письмо B2B-клиенту должно учитывать его задачу и роль, а не просто автоматически подставлять название компании.", personal: "Учебный кейс BIOCARD: ИИ может подготовить варианты поста или вопросов для интервью, но сотрудник проверяет факты, тон, конфиденциальность и соответствие реальному контексту." },
    mistakes: ["Копировать тренд без связи с задачей", "Считать автоматическую подстановку имени полноценной персонализацией", "Публиковать результат ИИ без проверки фактов и контекста"],
    microcheck: { q: "Какой самый простой тест отделяет полезный тренд от моды?", a: "Нужно показать, какую конкретную задачу аудитории и бизнеса он решает, чем лучше альтернатив и как будет измерен результат." },
    practice: { micro: "Возьмите один тренд и сформулируйте условие, при котором он полезен и бесполезен.", main: "Проведите аудит одной активности по четырём критериям: задача, ценность, данные, измерение.", advanced: "Опишите безопасный процесс использования ИИ с точками человеческой проверки." },
    reflection: "Какой инструмент ваша команда использует потому, что «так делают все», а не из-за доказанной пользы?",
    summary: ["Инструменты меняются быстрее маркетинговых принципов", "Омниканальность — это согласованный опыт, а не количество площадок", "Персонализация должна быть релевантной и этичной", "ИИ ускоряет работу, но не передаёт машине ответственность"],
    sources: { required: ["Kotler P., Kartajaya H., Setiawan I. — Marketing 5.0", "OECD — AI Principles"], additional: ["Lemon K. N., Verhoef P. C. — Customer Experience", "NIST — AI Risk Management Framework"] },
    quiz: [
      { q: "Что делает использование тренда обоснованным?", type: "single", options: [{ t: "Его популярность" }, { t: "Связь с задачей аудитории, преимуществом перед альтернативой и измеримым результатом", correct: true }, { t: "Одобрение конкурента" }, { t: "Новый интерфейс" }], explain: "Популярность не заменяет бизнес-логику." },
      { q: "Омниканальность — это:", type: "single", options: [{ t: "Аккаунты на всех площадках" }, { t: "Согласованный опыт и сохранение контекста между каналами", correct: true }, { t: "Одинаковый пост везде" }, { t: "Только CRM" }], explain: "Ключ — целостность опыта, а не число каналов." },
      { q: "Что обязательно при использовании ИИ в маркетинге?", type: "multi", options: [{ t: "Проверка фактов", correct: true }, { t: "Контроль конфиденциальности", correct: true }, { t: "Ответственность человека", correct: true }, { t: "Автоматическая публикация без просмотра" }], explain: "ИИ требует человеческого контроля и управления рисками." },
      { q: "Автоматическая вставка имени в письмо всегда является качественной персонализацией?", type: "single", options: [{ t: "Да" }, { t: "Нет, если содержание не учитывает задачу и контекст адресата", correct: true }, { t: "Только в B2C" }, { t: "Только при скидке" }], explain: "Персонализация должна менять релевантность, а не только обращение." },
      { q: "Компания публикует трендовый ролик, но не может назвать аудиторию и цель. Что это?", type: "case", options: [{ t: "Стратегический маркетинг" }, { t: "Инструмент без доказанной связи с задачей", correct: true }, { t: "Омниканальность" }, { t: "Исследование" }], explain: "Формат выбран раньше задачи." },
    ],
  },
  8: {
    place: "Урок 8 из 8 · объединяет модуль в единую диагностическую работу",
    prereq: "Уроки 1–7 модуля",
    results: ["Диагностировать маркетинговую проблему до выбора инструмента", "Связывать аудиторию, ценность, процесс, коммуникацию и метрики", "Подготовить краткий план улучшения реальной или учебной компании"],
    problemInput: "У компании падают обращения, и команда предлагает увеличить рекламный бюджет. Какие гипотезы нужно проверить, прежде чем соглашаться?",
    theory: [
      { label: "Начинайте с симптома, но не останавливайтесь на нём", text: "Падение обращений может быть связано со спросом, аудиторией, предложением, ценой, каналом, репутацией, качеством обработки или измерением. Симптом не указывает на единственную причину." },
      { label: "Диагностическая цепочка", text: "Полезно последовательно проверить: цель бизнеса, аудиторию и ситуацию выбора, задачу клиента, ценностное предложение, выполнение обещания, путь и барьеры, коммуникацию, передачу между функциями и данные." },
      { label: "Гипотеза и доказательство", text: "Хорошая гипотеза объясняет наблюдение, допускает проверку и заранее определяет, какие данные подтвердят или опровергнут её. Список идей без способа проверки — не гипотезы." },
      { label: "Приоритет действий", text: "Действия выбирают по ожидаемому влиянию, уверенности в гипотезе, стоимости, риску и зависимости от других функций. Самое заметное решение не всегда самое важное." },
    ],
    limitations: "Учебная диагностика не заменяет полноценное исследование и доступ к внутренним данным. В итоговой работе нужно явно отмечать, где есть факт, где интерпретация, а где предположение для проверки.",
    terms: [
      { term: "Симптом", def: "Наблюдаемое отклонение, которое может иметь несколько причин" },
      { term: "Гипотеза", def: "Проверяемое предположение о причине или способе улучшения результата" },
      { term: "Критерий проверки", def: "Заранее определённое наблюдение или показатель, по которому гипотеза будет подтверждена или отвергнута" },
    ],
    comparison: { title: "Поверхностное решение и диагностика", header: ["Шаг", "Поверхностный подход", "Системный подход"], rows: [["Проблема", "Мало заявок", "На каком этапе и у какой аудитории возникло отклонение?"], ["Причина", "Мало рекламы", "Какие альтернативные причины подтверждаются данными?"], ["Действие", "Увеличить бюджет", "Выбрать проверяемую гипотезу и минимальный тест"], ["Результат", "Больше охвата", "Изменение целевого поведения и бизнес-показателя"]] },
    examples: { neutral: "У магазина снизилась выручка: причиной может быть трафик, конверсия, средний чек, наличие товара или повторные покупки — каждый вариант требует разных действий.", b2b: "Снижение B2B-лидов может быть связано не с охватом, а с изменением критериев закупки, слабым доказательством надёжности или долгой обработкой обращения.", personal: "Учебный кейс BIOCARD: низкий отклик на внутреннюю инициативу может быть вызван не текстом анонса, а неудобным временем, недоверием, непонятной пользой или сложным способом участия." },
    mistakes: ["Выбирать инструмент до формулировки причины", "Смешивать факт, мнение и гипотезу", "Оценивать успех только по охвату, если цель — действие или изменение поведения"],
    microcheck: { q: "Почему «увеличим рекламный бюджет» не является полноценной гипотезой?", a: "В формулировке нет предполагаемой причины, механизма влияния и критерия, по которому решение будет проверено." },
    practice: { micro: "Для симптома «мало обращений» назовите пять альтернативных причин.", main: "Проведите диагностику реального кейса по цепочке: цель, аудитория, задача, ценность, процесс, путь, коммуникация, метрика.", advanced: "Сформулируйте три проверяемые гипотезы и расставьте приоритет по влиянию, уверенности, стоимости и риску." },
    reflection: "Какое решение вы недавно выбрали слишком быстро, не проверив альтернативные причины?",
    summary: ["Симптом не равен причине", "Диагностика проходит от цели и аудитории к процессу, коммуникации и данным", "Гипотеза должна быть проверяемой", "Приоритет определяется влиянием, уверенностью, стоимостью и риском"],
    sources: { required: ["Kotler P., Keller K. L. — Marketing Management", "Ries E. — The Lean Startup"], additional: ["Rumelt R. — Good Strategy/Bad Strategy", "Kahneman D. — Thinking, Fast and Slow"] },
    quiz: [
      { q: "Что делать первым при падении количества обращений?", type: "single", options: [{ t: "Сразу увеличить бюджет" }, { t: "Локализовать отклонение и сформулировать альтернативные причины", correct: true }, { t: "Сменить логотип" }, { t: "Опубликовать больше постов" }], explain: "Сначала нужна диагностика симптома." },
      { q: "Какие элементы отличают гипотезу от идеи?", type: "multi", options: [{ t: "Предполагаемая причина или механизм", correct: true }, { t: "Способ проверки", correct: true }, { t: "Критерий результата", correct: true }, { t: "Только уверенный тон" }], explain: "Проверяемость — ключевой признак гипотезы." },
      { q: "Охват вырос, но целевых действий не стало больше. Можно ли считать задачу выполненной?", type: "case", options: [{ t: "Да, охват всегда главная цель" }, { t: "Только если целью изначально был именно охват; иначе нужно оценивать целевое действие", correct: true }, { t: "Да, если публикаций было много" }, { t: "Нет, охват никогда не важен" }], explain: "Метрика должна соответствовать поставленной цели." },
      { q: "Что нужно разделять в итоговой диагностике?", type: "multi", options: [{ t: "Факты", correct: true }, { t: "Интерпретации", correct: true }, { t: "Гипотезы", correct: true }, { t: "Все объединить в один вывод" }], explain: "Разделение повышает качество решений и честность анализа." },
      { q: "Какой критерий НЕ относится к разумной приоритизации гипотез?", type: "single", options: [{ t: "Ожидаемое влияние" }, { t: "Уверенность" }, { t: "Стоимость и риск" }, { t: "Личная симпатия к формату", correct: true }], explain: "Предпочтение инструмента не заменяет оценку влияния и риска." },
    ],
  },

};

/* ============================================================
   УРОК — данные + рендер по академическому стандарту.
   Практика проверяется реальным ИИ-наставником (Anthropic API),
   с честным сообщением при недоступности сети.
   ============================================================ */

function AIFeedbackBox({ task, context, saved, onSave }) {
  const [answer, setAnswer] = useState(saved?.answer || "");
  const [feedback, setFeedback] = useState(saved?.feedback || null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await callAIMentor({ task, answer, context });
    setFeedback(res.text);
    setLoading(false);
    onSave({ answer, feedback: res.text });
  }

  return (
    <div>
      <textarea value={answer} onChange={(e) => { setAnswer(e.target.value); }} placeholder="Ваш ответ…"
        style={{ width: "100%", minHeight: 100, padding: 12, borderRadius: 10, border: `1px solid ${T.border}`,
          fontFamily: bodyFont, fontSize: 13, color: T.ink, resize: "vertical", boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => onSave({ answer, feedback })} style={ghostBtn}><Save size={13} /> Сохранить черновик</button>
        <button onClick={submit} disabled={!answer.trim() || loading} style={{ ...ghostBtn, opacity: !answer.trim() || loading ? 0.5 : 1 }}>
          {loading ? <Loader2 size={13} className="spin" /> : <Send size={13} />} Отправить ИИ-наставнику
        </button>
      </div>
      {feedback && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: T.surfaceSoft }}>
          <SectionLabel>Обратная связь</SectionLabel>
          <p style={{ fontFamily: bodyFont, fontSize: 13, color: T.ink, lineHeight: 1.6, marginTop: 8, whiteSpace: "pre-wrap" }}>{feedback}</p>
        </div>
      )}
    </div>
  );
}


function VisualLessonMap({ lessonId, active, onChange }) {
  const flows = {
    1: ["Масштаб", "Неопределённость", "Исследование", "Система"],
    2: ["Ориентация", "Фокус", "Риск", "Ценность"],
    3: ["Рынок", "Аудитория", "Ценность", "Обмен", "Результат"],
    4: ["Обещание", "Передача", "Исполнение", "Опыт"],
    5: ["Потребность", "Желание", "Спрос", "Ценность", "Лояльность"],
    6: ["Вопрос", "Модель", "Анализ", "Ограничения", "Решение"],
    7: ["Задача", "Инструмент", "Данные", "Проверка", "Этика"],
    8: ["Симптом", "Гипотеза", "Тест", "Данные", "Приоритет"],
  };
  const stages = [
    { key: "theory", label: "Понять", icon: BookOpen },
    { key: "practice", label: "Применить", icon: Sparkles },
    { key: "test", label: "Проверить", icon: Target },
    { key: "wrap", label: "Закрепить", icon: Trophy },
  ];
  const flow = flows[lessonId] || flows[3];
  return (
    <div className="v6-visual-map">
      <div className="v6-stage-row">
        {stages.map(({ key, label, icon: Icon }, index) => {
          const activeIndex = stages.findIndex((x) => x.key === active);
          const done = index < activeIndex;
          return (
            <button key={key} onClick={() => onChange(key)} className={`v6-stage ${active === key ? "active" : ""} ${done ? "done" : ""}`}>
              <span>{done ? <Check size={15} /> : <Icon size={15} />}</span>
              <strong>{label}</strong>
            </button>
          );
        })}
      </div>
      <div className="v6-flow-row">
        {flow.map((item, index) => (
          <div className="v6-flow-step" key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item}</strong>
            {index < flow.length - 1 && <ArrowRight size={14} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function LegacyLesson({ lessonId, onComplete, nextLabel, onBack, practiceStore, onPracticeSave, userContext }) {
  const meta = MODULE1_LESSON_META.find((l) => l.id === lessonId);
  const data = LESSON_CONTENT[lessonId];
  const [tab, setTab] = useState("theory");
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [exampleTab, setExampleTab] = useState("neutral");
  const [showCheck, setShowCheck] = useState(false);
  const [reflection, setReflection] = useState("");
  const seed = lessonId * 9973;
  const quizShuffled = useMemo(() => (data ? data.quiz.map((q, i) => ({ ...q, order: shuffle(q.options.map((_, oi) => oi), seed + i) })) : []), [data, seed]);

  if (!data) {
    return (
      <div>
        <button onClick={onBack} style={{ ...secondaryBtn, marginBottom: 20, padding: "8px 14px" }}><ArrowLeft size={14} /> К обзору модуля</button>
        <Card style={{ maxWidth: 480 }}>
          <SectionLabel>Урок анонсирован, но ещё не раскрыт</SectionLabel>
          <p style={{ fontFamily: bodyFont, fontSize: 14, color: T.inkSoft, marginTop: 8 }}>
            Структура утверждена и видна в обзоре модуля. Полное содержание появится в следующей итерации —
            мы не публикуем поверхностный текст только ради галочки «готово».
          </p>
        </Card>
      </div>
    );
  }

  const tabs = [{ key: "theory", label: "Теория" }, { key: "practice", label: "Практика" }, { key: "test", label: "Тест" }, { key: "wrap", label: "Итоги" }];
  const quiz = quizShuffled;
  const q = quiz[quizIdx];
  const orderedOptions = q ? q.order.map((oi) => q.options[oi]) : [];

  const selectedIds = q?.type === "multi"
    ? (Array.isArray(selected) ? selected : [])
    : (selected === null ? [] : [selected]);
  const correctIds = q ? q.options.map((option, index) => option.correct ? index : null).filter((index) => index !== null) : [];
  const isQuestionCorrect = q
    ? selectedIds.length === correctIds.length && correctIds.every((index) => selectedIds.includes(index))
    : false;

  function toggleOption(optionId) {
    if (checked) return;
    if (q.type === "multi") {
      setSelected((current) => {
        const values = Array.isArray(current) ? current : [];
        return values.includes(optionId)
          ? values.filter((id) => id !== optionId)
          : [...values, optionId];
      });
    } else {
      setSelected(optionId);
    }
  }

  function submitAnswer() {
    setChecked(true);
    if (isQuestionCorrect) setScore((s) => s + 1);
  }

  function nextQuestion() {
    if (quizIdx < quiz.length - 1) {
      setQuizIdx((i) => i + 1);
      setSelected(null);
      setChecked(false);
    } else setTab("wrap");
  }

  const psKey = `l${lessonId}`;
  const ps = practiceStore[psKey] || {};

  return (
    <div className="lesson-page-v6" style={{ maxWidth: 960 }}>
      <button onClick={onBack} style={{ ...secondaryBtn, marginBottom: 18, padding: "8px 14px", borderRadius: 999 }}><ArrowLeft size={14} /> К обзору модуля</button>

      <section style={{ position: "relative", overflow: "hidden", padding: "30px 32px", borderRadius: 26, background: `linear-gradient(135deg, ${T.ink} 0%, #303653 70%, #41486d 100%)`, color: T.surface, marginBottom: 18, boxShadow: "0 24px 60px rgba(26,30,54,0.18)" }}>
        <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "rgba(231,163,62,0.14)", right: -80, top: -100 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
            <Pill tone="gold">Модуль 01</Pill>
            <span style={{ fontFamily: monoFont, fontSize: 11, letterSpacing: "0.08em", color: "#CED2E8" }}>УРОК {lessonId} ИЗ 8</span>
            <span style={{ fontFamily: bodyFont, fontSize: 12, color: "#CED2E8" }}>· {meta.duration}</span>
          </div>
          <h1 style={{ fontFamily: displayFont, fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 600, lineHeight: 1.08, maxWidth: 720, margin: "0 0 14px" }}>{meta.title}</h1>
          <p style={{ fontFamily: bodyFont, fontSize: 16, lineHeight: 1.65, color: "#D7DAEA", maxWidth: 720, margin: 0 }}>{meta.question}</p>
          <div style={{ marginTop: 24, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Pill tone="indigo">{data.prereq}</Pill>
            <span style={{ fontFamily: bodyFont, fontSize: 12, color: "#B9BEDA" }}>{data.place}</span>
          </div>
        </div>
      </section>

      <div style={{ padding: 8, background: T.surface, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginBottom: 24, borderRadius: 18, border: `1px solid ${T.border}`, boxShadow: "0 10px 30px rgba(24,28,54,0.06)", position: "sticky", top: 10, zIndex: 5 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "11px 12px", borderRadius: 12, border: "none", cursor: "pointer",
            fontFamily: bodyFont, fontSize: 13, fontWeight: 700,
            background: tab === t.key ? T.ink : "transparent",
            color: tab === t.key ? T.surface : T.inkFaint }}>{t.label}</button>
        ))}
      </div>

      <VisualLessonMap lessonId={lessonId} active={tab} onChange={setTab} />

      {tab === "theory" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginBottom: 18 }}>
          <Card style={{ marginBottom: 0, background: T.indigoSoft, border: "none", padding: 24, borderRadius: 20, boxShadow: "0 10px 30px rgba(24,28,54,0.06)" }}>
            <SectionLabel>Проблемный вход</SectionLabel>
            <p style={{ fontFamily: bodyFont, fontSize: 15, color: T.ink, lineHeight: 1.6, marginTop: 8 }}>{data.problemInput}</p>
          </Card>
          <Card style={{ marginBottom: 0, padding: 22, borderRadius: 20, boxShadow: "0 10px 30px rgba(24,28,54,0.06)" }}>
            <SectionLabel>После урока вы сможете</SectionLabel>
            <ul style={{ fontFamily: bodyFont, fontSize: 14, color: T.ink, lineHeight: 1.8, margin: "10px 0 0", paddingLeft: 18 }}>
              {data.results.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </Card>
          </div>

          <SectionLabel>Ключевые идеи</SectionLabel>
          <h2 style={{ fontFamily: displayFont, fontSize: 28, color: T.ink, margin: "6px 0 16px" }}>Разбираем тему по шагам</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginBottom: 18 }}>
          {data.theory.map((block, index) => (
            <Card key={block.label} style={{ padding: 22, minHeight: 205, borderRadius: 20, boxShadow: "0 10px 30px rgba(24,28,54,0.06)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: index % 2 === 0 ? T.goldSoft : T.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: monoFont, fontWeight: 700, color: T.ink, marginBottom: 16 }}>{String(index + 1).padStart(2, "0")}</div>
              <h3 style={{ fontFamily: displayFont, fontSize: 21, lineHeight: 1.25, color: T.ink, margin: "0 0 10px" }}>{block.label}</h3>
              <p style={{ fontFamily: bodyFont, fontSize: 14, color: T.inkSoft, lineHeight: 1.7, margin: 0 }}>{block.text}</p>
            </Card>
          ))}
          </div>
          <Card style={{ marginBottom: 18, background: T.berrySoft, border: "none", padding: 22, borderRadius: 20 }}>
            <SectionLabel>Ограничения модели</SectionLabel>
            <p style={{ fontFamily: bodyFont, fontSize: 13, color: T.ink, lineHeight: 1.6, marginTop: 8 }}>{data.limitations}</p>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Термины</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {data.terms.map((t) => <TermRow key={t.term} term={t.term} def={t.def} />)}
            </div>
          </Card>
          {data.comparison && (
            <Card style={{ marginBottom: 16, overflowX: "auto" }}>
              <SectionLabel>{data.comparison.title}</SectionLabel>
              <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse", fontFamily: bodyFont, fontSize: 13 }}>
                <tbody>
                  {data.comparison.rows.map((row, ri) => (
                    <tr key={ri} style={{ borderTop: `1px solid ${T.border}` }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: "8px 10px", color: ci === 0 ? T.ink : T.inkSoft, fontWeight: ci === 0 ? 700 : 400, verticalAlign: "top" }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          <Card style={{ marginBottom: 18, padding: 22, borderRadius: 20, boxShadow: "0 10px 30px rgba(24,28,54,0.06)" }}>
            <SectionLabel>Примеры в разных контекстах</SectionLabel>
            <div style={{ display: "flex", gap: 6, marginTop: 10, marginBottom: 12 }}>
              {[["neutral", "Нейтральный"], ["b2b", "B2B"], ["personal", "BIOCARD"]].map(([k, l]) => (
                <button key={k} onClick={() => setExampleTab(k)} style={{
                  padding: "6px 12px", borderRadius: 8, border: `1px solid ${exampleTab === k ? T.ink : T.border}`,
                  background: exampleTab === k ? T.ink : T.surface, color: exampleTab === k ? T.surface : T.inkSoft,
                  fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
              ))}
            </div>
            <p style={{ fontFamily: bodyFont, fontSize: 14, color: T.ink, lineHeight: 1.6, margin: 0 }}>{data.examples[exampleTab]}</p>
            {exampleTab === "personal" && (
              <div style={{ marginTop: 8 }}><Pill tone="berry">Учебный смоделированный кейс</Pill></div>
            )}
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Типичные ошибки</SectionLabel>
            <ul style={{ fontFamily: bodyFont, fontSize: 14, color: T.inkSoft, lineHeight: 1.8, margin: "10px 0 0", paddingLeft: 18 }}>
              {data.mistakes.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Мини-проверка (без оценки)</SectionLabel>
            <p style={{ fontFamily: bodyFont, fontSize: 14, color: T.ink, lineHeight: 1.6, marginTop: 8 }}>{data.microcheck.q}</p>
            {!showCheck ? (
              <button onClick={() => setShowCheck(true)} style={{ ...ghostBtn, marginTop: 10 }}>Показать ответ</button>
            ) : (
              <p style={{ fontFamily: bodyFont, fontSize: 13, color: T.teal, lineHeight: 1.6, marginTop: 10 }}>{data.microcheck.a}</p>
            )}
          </Card>
          <button onClick={() => setTab("practice")} style={{ ...primaryBtn, borderRadius: 999, padding: "13px 22px" }}>Перейти к практике <ArrowRight size={15} /></button>
        </div>
      )}

      {tab === "practice" && (
        <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionLabel>Практическая часть</SectionLabel>
          <h2 style={{ fontFamily: displayFont, fontSize: 30, color: T.ink, margin: "-4px 0 4px" }}>Переводим теорию в рабочие решения</h2>
          {[["micro", "Микроупражнение", data.practice.micro], ["main", "Основное задание", data.practice.main], ["advanced", "Задание повышенной сложности", data.practice.advanced]].map(([k, label, prompt]) => (
            <Card key={k} style={{ padding: 24, borderRadius: 20, boxShadow: "0 10px 30px rgba(24,28,54,0.06)" }}>
              <SectionLabel>{label}</SectionLabel>
              <p style={{ fontFamily: bodyFont, fontSize: 14, color: T.ink, lineHeight: 1.6, margin: "8px 0 14px" }}>{prompt}</p>
              <AIFeedbackBox task={prompt} context={userContext} saved={ps[k]} onSave={(v) => onPracticeSave(psKey, k, v)} />
            </Card>
          ))}
          <button onClick={() => setTab("test")} style={primaryBtn}>К тесту <ArrowRight size={15} /></button>
        </div>
      )}

      {tab === "test" && q && (
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionLabel>Вопрос {quizIdx + 1} из {quiz.length}</SectionLabel>
            <Pill tone="indigo">{q.type === "multi" ? "Несколько ответов" : "Один ответ"}</Pill>
          </div>
          <Card style={{ padding: 26, borderRadius: 20, boxShadow: "0 10px 30px rgba(24,28,54,0.06)" }}>
            <p style={{ fontFamily: displayFont, fontSize: 21, fontWeight: 500, color: T.ink, lineHeight: 1.45, margin: "0 0 20px" }}>{q.q}</p>
            {q.type === "multi" && (
              <p style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkFaint, margin: "-10px 0 16px" }}>Можно выбрать несколько вариантов.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orderedOptions.map((opt, i) => {
                const optId = q.order[i];
                const isSel = selectedIds.includes(optId);
                const isRight = checked && opt.correct;
                const isWrong = checked && isSel && !opt.correct;
                return (
                  <button key={i} onClick={() => toggleOption(optId)} style={{
                    textAlign: "left", padding: "13px 16px", borderRadius: 10, cursor: checked ? "default" : "pointer",
                    border: `1.5px solid ${isRight ? T.teal : isWrong ? T.berry : isSel ? T.ink : T.border}`,
                    background: isRight ? T.tealSoft : isWrong ? T.berrySoft : isSel ? T.surfaceSoft : T.surface,
                    fontFamily: bodyFont, fontSize: 14, color: T.ink, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        width: 18,
                        height: 18,
                        flex: "0 0 18px",
                        borderRadius: q.type === "multi" ? 5 : "50%",
                        border: `1.5px solid ${isSel ? T.ink : T.border}`,
                        background: isSel ? T.ink : T.surface,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {isSel && <Check size={12} color={T.surface} />}
                      </span>
                      <span>{opt.t}</span>
                    </span>
                    {isRight && <CheckCircle2 size={16} color={T.teal} />}{isWrong && <X size={16} color={T.berry} />}
                  </button>
                );
              })}
            </div>
            {checked && (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: T.surfaceSoft }}>
                <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: isQuestionCorrect ? T.teal : T.berry, marginBottom: 4 }}>
                  {isQuestionCorrect ? "Верно" : "Неверно"}
                </div>
                <p style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkSoft, lineHeight: 1.5, margin: 0 }}>{q.explain}</p>
              </div>
            )}
            <div style={{ marginTop: 18 }}>
              {!checked ? (
                <button onClick={submitAnswer} disabled={selectedIds.length === 0} style={{ ...primaryBtn, marginTop: 0, opacity: selectedIds.length === 0 ? 0.4 : 1 }}>Ответить</button>
              ) : (
                <button onClick={nextQuestion} style={{ ...primaryBtn, marginTop: 0 }}>{quizIdx < quiz.length - 1 ? "Следующий вопрос" : "К итогам урока"} <ArrowRight size={15} /></button>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === "wrap" && (
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Trophy size={28} color="#8A5B12" />
            </div>
            <h2 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, color: T.ink, margin: "0 0 8px" }}>Урок пройден</h2>
            <p style={{ fontFamily: bodyFont, fontSize: 15, color: T.inkSoft }}>Тест: <b style={{ color: T.ink }}>{score} из {quiz.length}</b></p>
          </div>
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Резюме урока</SectionLabel>
            <ul style={{ fontFamily: bodyFont, fontSize: 14, color: T.ink, lineHeight: 1.8, margin: "10px 0 0", paddingLeft: 18 }}>
              {data.summary.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Источники</SectionLabel>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: T.inkFaint, marginBottom: 4 }}>ОБЯЗАТЕЛЬНЫЕ</div>
              <ul style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkSoft, lineHeight: 1.7, margin: "0 0 10px", paddingLeft: 18 }}>
                {data.sources.required.map((s) => <li key={s}>{s}</li>)}
              </ul>
              <div style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: T.inkFaint, marginBottom: 4 }}>ДОПОЛНИТЕЛЬНЫЕ</div>
              <ul style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkSoft, lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
                {data.sources.additional.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </Card>
          <Card style={{ marginBottom: 20 }}>
            <SectionLabel>Рефлексия</SectionLabel>
            <p style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkSoft, marginTop: 8, marginBottom: 10 }}>{data.reflection}</p>
            <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Пара предложений — сохранится в заметках личного кабинета"
              style={{ width: "100%", minHeight: 70, padding: 12, borderRadius: 10, border: `1px solid ${T.border}`,
                fontFamily: bodyFont, fontSize: 13, color: T.ink, resize: "vertical", boxSizing: "border-box" }} />
          </Card>
          <button onClick={() => onComplete(lessonId, score, quiz.length, reflection)} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
            {nextLabel} <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function Lesson(props) {
  return <LegacyLesson {...props} />;
}

/* ============================================================
   ОБЗОР МОДУЛЯ 1 — статусы уроков считаются из диагностики
   ============================================================ */

function lessonStatus(lessonId, completedCount, competencies) {
  if (lessonId <= completedCount) return { label: "Пройден", tone: "teal" };
  if (lessonId > completedCount + 1) return { label: "Заблокирован", tone: "neutral" };
  // следующий доступный урок — смотрим, есть ли сильное подтверждённое владение по смежным темам
  const relevant = lessonId <= 2 ? competencies.find((c) => c.key === (lessonId === 1 ? "terms" : "concepts")) : null;
  if (relevant && relevant.level === "продвинутый" && relevant.evidence >= 2) return { label: "Контрольное прохождение", tone: "gold" };
  if (relevant && (relevant.level === "начальный" || relevant.level === "недостаточно данных")) return { label: "Обязательный полный", tone: "indigo" };
  return { label: "Обязательный полный", tone: "indigo" };
}

function ModuleOverview({ completedCount, competencies, onOpenLesson }) {
  return (
    <div>
      <PageHeader eyebrow="Модуль 01 · 8 уроков · 15–25 ак. часов" title="Основы современного маркетинга" />
      <p style={{ fontFamily: bodyFont, fontSize: 14, color: T.inkFaint, marginBottom: 24, maxWidth: 580 }}>
        Программа модуля состоит из восьми последовательных уроков. Каждый урок включает теорию, практику,
        проверку знаний и итоговую рефлексию.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
        {MODULE1_LESSON_META.map((l) => {
          const status = lessonStatus(l.id, completedCount, competencies);
          const unlocked = l.id <= completedCount + 1;
          const clickable = unlocked && l.built;
          return (
            <Card key={l.id} onClick={clickable ? () => onOpenLesson(l.id) : undefined} style={{
              display: "flex", alignItems: "center", gap: 14, opacity: unlocked ? 1 : 0.55,
              borderColor: clickable ? T.ink : T.border }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: status.label === "Пройден" ? T.tealSoft : clickable ? T.goldSoft : T.surfaceSoft,
                color: status.label === "Пройден" ? T.teal : clickable ? "#8A5B12" : T.inkFaint }}>
                {status.label === "Пройден" ? <CheckCircle2 size={17} /> : unlocked ? <BookOpen size={16} /> : <Lock size={14} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: T.ink }}>Урок {l.id}. {l.title}</div>
                  <Pill tone={status.tone}>{status.label}</Pill>
                  {!l.built && <Pill tone="neutral">Анонс</Pill>}
                </div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkFaint, marginTop: 4 }}>{l.question}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkFaint, marginTop: 2 }}>{l.duration}</div>
                {!l.built && l.results && (
                  <ul style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkFaint, margin: "6px 0 0", paddingLeft: 16, lineHeight: 1.6 }}>
                    {l.results.map((o) => <li key={o}>{o}</li>)}
                  </ul>
                )}
              </div>
              {clickable && <ChevronRight size={17} color={T.inkFaint} />}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   ГЛАВНЫЙ ЭКРАН — только реальные показатели
   ============================================================ */

function Dashboard({ state, onGoLesson }) {
  const { profile, completedLessons, points, streak, competencies } = state;
  const percent = Math.round((completedLessons / 8) * 100);
  const nextLessonId = Math.min(completedLessons + 1, 8);
  const nextMeta = MODULE1_LESSON_META.find((l) => l.id === nextLessonId);
  const weakest = competencies ? [...competencies].sort((a, b) => (a.correct / (a.evidence || 1)) - (b.correct / (b.evidence || 1)))[0] : null;

  return (
    <div className="dashboard-page">
      <PageHeader eyebrow={`С возвращением, ${profile.preferredName || "коллега"}`} title="Главный экран" />
      <div className="dashboard-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ background: T.ink, color: T.surface, border: "none" }}>
          <Pill tone="gold">Модуль 01 · Урок {nextLessonId} из 8</Pill>
          <h3 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, margin: "14px 0 8px" }}>
            {nextMeta ? nextMeta.title : "Модуль пройден"}
          </h3>
          <p style={{ fontFamily: bodyFont, fontSize: 14, color: "#B9BEDA", maxWidth: 380, lineHeight: 1.5 }}>
            {nextMeta && !nextMeta.built ? "Этот урок пока анонс — следующий полностью раскрытый доступен в обзоре модуля." : nextMeta ? nextMeta.question : "Загляните в личный кабинет за портфолио."}
          </p>
          {nextMeta && nextMeta.built && (
            <button onClick={() => onGoLesson(nextLessonId)} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20,
              padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer", background: T.gold, color: T.ink,
              fontFamily: bodyFont, fontSize: 14, fontWeight: 700 }}>Продолжить обучение <ArrowRight size={15} /></button>
          )}
        </Card>
        <Card style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <ProgressRing percent={percent} />
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 28, fontWeight: 600, color: T.ink }}>{percent}%</div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkFaint }}>модуля 1 пройдено</div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkFaint, marginTop: 4 }}>{completedLessons} из 8 уроков завершено</div>
          </div>
        </Card>
      </div>

      <div className="dashboard-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard icon={Flame} tone="berry" value={String(streak)} label="дней подряд" />
        <StatCard icon={Star} tone="gold" value={String(points)} label="баллов за реальные действия" />
        <StatCard icon={Trophy} tone="indigo" value="0" label="сертификатов" />
        <StatCard icon={Target} tone="teal" value={completedLessons >= 8 ? "Готово" : `Урок ${nextLessonId}`} label="ближайшая цель" />
      </div>

      <Card>
        <SectionLabel>Персональная рекомендация</SectionLabel>
        {weakest && weakest.evidence > 0 ? (
          <p style={{ fontFamily: bodyFont, fontSize: 14, color: T.ink, lineHeight: 1.6, marginTop: 10 }}>
            В диагностике слабее всего подтвердилась тема «{weakest.label}» ({weakest.correct} из {weakest.evidence} верно).
            Рекомендуем не спешить с этой темой в уроках модуля и вернуться к её примерам ещё раз.
          </p>
        ) : (
          <p style={{ fontFamily: bodyFont, fontSize: 14, color: T.inkFaint, lineHeight: 1.6, marginTop: 10 }}>
            Диагностика ещё не пройдена — рекомендации появятся после неё.
          </p>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, tone, value, label }) {
  const tones = { gold: T.gold, teal: T.teal, berry: T.berry, indigo: T.indigo };
  return (
    <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${tones[tone]}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={tones[tone]} />
      </div>
      <div>
        <div style={{ fontFamily: monoFont, fontSize: 18, fontWeight: 600, color: T.ink, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkFaint, marginTop: 2 }}>{label}</div>
      </div>
    </Card>
  );
}

/* ============================================================
   КАРТА КУРСА (17 модулей) — без изменений в идее, дизайн сохранён
   ============================================================ */

function CourseMap({ completedLessons, onOpenModule1 }) {
  const [preview, setPreview] = useState(null);
  const rowH = 108;
  const svgH = MODULES.length * rowH + 40;
  const points = MODULES.map((m, i) => ({ ...m, x: i % 2 === 0 ? 90 : 380, y: 40 + i * rowH }));
  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `Q ${p.x < points[i - 1].x ? p.x + 140 : p.x - 140} ${(p.y + points[i - 1].y) / 2}, ${p.x} ${p.y}`)).join(" ");
  const diplomaBlocked = completedLessons < 8;

  return (
    <div>
      <PageHeader eyebrow="17 модулей · фундамент открывается последовательно" title="Карта обучения" />
      <div style={{ position: "relative", maxWidth: 620 }}>
        <svg width="100%" height={svgH} viewBox={`0 0 470 ${svgH}`} style={{ position: "absolute", top: 0, left: 0 }}>
          <path d={pathD} stroke={T.border} strokeWidth={3} fill="none" strokeDasharray="1 10" strokeLinecap="round" />
        </svg>
        <div style={{ position: "relative" }}>
          {points.map((m, i) => {
            const isDiploma = m.id === 17;
            const unlocked = m.id === 1;
            const isLeft = i % 2 === 0;
            return (
              <div key={m.id} style={{ position: "relative", height: rowH, display: "flex", justifyContent: isLeft ? "flex-start" : "flex-end" }}>
                <div onClick={() => setPreview(m)} style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: unlocked ? T.gold : T.surface, border: `2px solid ${unlocked ? T.gold : T.border}`,
                  color: unlocked ? T.ink : T.inkFaint, marginLeft: isLeft ? 70 : 0, marginRight: isLeft ? 0 : 70,
                  boxShadow: unlocked ? "0 4px 14px rgba(231,163,62,0.35)" : "none" }}>
                  {isDiploma ? <Trophy size={16} /> : unlocked ? <BookOpen size={16} /> : <Lock size={14} />}
                </div>
                <div onClick={() => setPreview(m)} style={{ position: "absolute", top: 0, left: isLeft ? 126 : "auto", right: isLeft ? "auto" : 126, width: 230, cursor: "pointer" }}>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontFamily: monoFont, fontSize: 11, color: T.inkFaint, marginBottom: 4 }}>МОДУЛЬ {String(m.id).padStart(2, "0")} · {m.level}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>{m.title}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {preview && (
        <ModulePreviewModal module={preview} unlocked={preview.id === 1} diplomaBlocked={preview.id === 17 && diplomaBlocked}
          onClose={() => setPreview(null)} onStart={() => { setPreview(null); onOpenModule1(); }} />
      )}
    </div>
  );
}

function ModulePreviewModal({ module, unlocked, diplomaBlocked, onClose, onStart }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(22,26,46,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: 20, padding: 28, width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Pill tone={unlocked ? "gold" : "neutral"}>{unlocked ? "Доступен" : diplomaBlocked ? "Требует всех модулей" : "Заблокирован"}</Pill>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: T.inkFaint }}><X size={18} /></button>
        </div>
        <div style={{ fontFamily: monoFont, fontSize: 12, color: T.inkFaint, margin: "14px 0 4px" }}>МОДУЛЬ {String(module.id).padStart(2, "0")}</div>
        <h3 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, color: T.ink, margin: "0 0 10px" }}>{module.title}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          <MetaRow label="Уровень" value={module.level} />
          <MetaRow label="Длительность" value={module.duration} />
          <MetaRow label="Уроков" value={module.lessons} />
        </div>
        {unlocked ? (
          <button onClick={onStart} style={{ ...primaryBtn, marginTop: 0, width: "100%", justifyContent: "center" }}>Открыть модуль <ArrowRight size={15} /></button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.inkFaint, fontFamily: bodyFont, fontSize: 13 }}>
            <Lock size={14} /> {diplomaBlocked ? "Диплом остаётся заблокированным до выполнения обязательных требований" : "Фундаментальные модули открываются последовательно"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ЛИЧНЫЙ КАБИНЕТ
   ============================================================ */

function Cabinet({ state, onUpdateProfile, onUpdateNotes }) {
  const { profile, competencies, notes, history } = state;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const sorted = competencies ? [...competencies].sort((a, b) => (b.correct / (b.evidence || 1)) - (a.correct / (a.evidence || 1))) : [];

  return (
    <div className="cabinet-page">
      <PageHeader eyebrow="Личный кабинет" title="Профиль и карта компетенций" />
      <div className="cabinet-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SectionLabel>Компетенции · уровень, а не выдуманный процент</SectionLabel>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              {sorted.map((c) => (
                <div key={c.key} style={{ paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: T.ink }}>{c.label}</span>
                    <Pill tone={c.level === "недостаточно данных" ? "neutral" : c.level === "начальный" ? "berry" : c.level === "базовый" ? "gold" : "teal"}>{c.level}</Pill>
                  </div>
                  <div style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkFaint }}>
                    {c.evidence} заданий · уверенность: {c.confidence} · последняя проверка: {c.lastChecked}
                  </div>
                  {c.wrongTopics.length > 0 && (
                    <div style={{ fontFamily: bodyFont, fontSize: 12, color: T.berry, marginTop: 4 }}>
                      Ошибка в: {c.wrongTopics[0]}
                    </div>
                  )}
                </div>
              ))}
              {sorted.length === 0 && <p style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkFaint }}>Пройдите диагностику, чтобы увидеть карту.</p>}
            </div>
          </Card>

          <Card>
            <SectionLabel>Заметки</SectionLabel>
            <textarea value={notes || ""} onChange={(e) => onUpdateNotes(e.target.value)} placeholder="Свободные заметки — сохраняются автоматически"
              style={{ width: "100%", minHeight: 90, marginTop: 10, padding: 12, borderRadius: 10, border: `1px solid ${T.border}`,
                fontFamily: bodyFont, fontSize: 13, color: T.ink, resize: "vertical", boxSizing: "border-box" }} />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SectionLabel>Профиль</SectionLabel>
              <button onClick={() => { setEditing(!editing); setDraft(profile); }} style={ghostBtn}>{editing ? "Отмена" : "Редактировать"}</button>
            </div>
            {!editing ? (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <MetaRow label="Обращение" value={profile.preferredName || "—"} />
                <MetaRow label="Должность" value={profile.position || "—"} />
                <MetaRow label="Компания / сфера" value={`${profile.company} · ${profile.sphere}`} />
                <MetaRow label="Стаж" value={profile.experience || "—"} />
                <MetaRow label="Самостоятельность" value={profile.autonomy || "—"} />
                <MetaRow label="Время в неделю" value={profile.weeklyTime || "—"} />
                <MetaRow label="Приоритет на 3 месяца" value={profile.priority || "—"} />
              </div>
            ) : (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {["preferredName", "position", "priority"].map((k) => (
                  <input key={k} value={draft[k] || ""} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                    style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: bodyFont, fontSize: 13 }} />
                ))}
                <button onClick={() => { onUpdateProfile(draft); setEditing(false); }} style={{ ...primaryBtn, marginTop: 4 }}>Сохранить</button>
              </div>
            )}
          </Card>
          <Card>
            <SectionLabel>Достижения</SectionLabel>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <Badge icon={Target} label="Диагностика пройдена" earned={!!competencies} />
              <Badge icon={Sparkles} label="Первый урок завершён" earned={state.completedLessons >= 1} />
              <Badge icon={Trophy} label="Модуль 1 завершён" earned={state.completedLessons >= 8} />
            </div>
          </Card>
          <Card>
            <SectionLabel>История</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {(history || []).slice().reverse().slice(0, 6).map((h, i) => (
                <div key={i} style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkSoft }}>{h.date} · {h.text}</div>
              ))}
              {(!history || history.length === 0) && <p style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkFaint }}>Пока пусто</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label, earned }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: earned ? T.goldSoft : T.surfaceSoft, opacity: earned ? 1 : 0.5 }}>
      <Icon size={15} color={earned ? "#8A5B12" : T.inkFaint} />
      <span style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: earned ? "#8A5B12" : T.inkFaint }}>{label}</span>
    </div>
  );
}

/* ============================================================
   ПОРТФОЛИО — итоговая работа модуля 1 с версиями и ИИ-проверкой
   ============================================================ */

const FINAL_WORK_SPEC = {
  title: "Анализ маркетинга выбранной компании как системы создания и передачи ценности",
  parts: [
    "Описание компании и рынка", "Основного клиента или группы клиентов", "Создаваемую ценность",
    "Потребность, желание и спрос", "Текущую маркетинговую концепцию",
    "Связь маркетинга с продуктом, продажами, сервисом и другими функциями",
    "Признаки сведения маркетинга только к продвижению", "Предложения по улучшению",
    "Ограничения анализа и недостающие данные",
  ],
};

function Portfolio({ state, onSaveWork, userContext }) {
  const work = state.portfolio.module1FinalWork || { v1: "", feedback1: null, v2: "", feedback2: null };
  const [v1, setV1] = useState(work.v1);
  const [v2, setV2] = useState(work.v2);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  async function checkV1() {
    setLoading1(true);
    const res = await callAIMentor({ task: FINAL_WORK_SPEC.title + ": " + FINAL_WORK_SPEC.parts.join("; "), answer: v1, context: userContext });
    onSaveWork({ ...work, v1, feedback1: res.text });
    setLoading1(false);
  }
  async function checkV2() {
    setLoading2(true);
    const res = await callAIMentor({ task: "Улучшенная версия того же анализа с учётом обратной связи: " + FINAL_WORK_SPEC.title, answer: v2, context: userContext });
    onSaveWork({ ...work, v2, feedback2: res.text });
    setLoading2(false);
  }

  return (
    <div>
      <PageHeader eyebrow="Портфолио" title="Итоговая работа модуля 1" />
      <Card style={{ marginBottom: 20, maxWidth: 700 }}>
        <SectionLabel>{FINAL_WORK_SPEC.title}</SectionLabel>
        <ul style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkSoft, lineHeight: 1.8, margin: "10px 0 0", paddingLeft: 18 }}>
          {FINAL_WORK_SPEC.parts.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 900 }}>
        <Card>
          <SectionLabel>Версия 1</SectionLabel>
          <textarea value={v1} onChange={(e) => { setV1(e.target.value); onSaveWork({ ...work, v1: e.target.value }); }}
            placeholder="Черновик анализа…" style={{ width: "100%", minHeight: 220, marginTop: 10, padding: 12, borderRadius: 10,
              border: `1px solid ${T.border}`, fontFamily: bodyFont, fontSize: 13, color: T.ink, resize: "vertical", boxSizing: "border-box" }} />
          <button onClick={checkV1} disabled={!v1.trim() || loading1} style={{ ...ghostBtn, marginTop: 10, opacity: !v1.trim() || loading1 ? 0.5 : 1 }}>
            {loading1 ? "Проверяю…" : "Отправить на проверку"}
          </button>
          {work.feedback1 && <p style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkSoft, marginTop: 10, whiteSpace: "pre-wrap" }}>{work.feedback1}</p>}
        </Card>
        <Card>
          <SectionLabel>Версия 2 (улучшенная)</SectionLabel>
          <textarea value={v2} onChange={(e) => { setV2(e.target.value); onSaveWork({ ...work, v2: e.target.value }); }}
            placeholder="Перепишите с учётом обратной связи…" style={{ width: "100%", minHeight: 220, marginTop: 10, padding: 12, borderRadius: 10,
              border: `1px solid ${T.border}`, fontFamily: bodyFont, fontSize: 13, color: T.ink, resize: "vertical", boxSizing: "border-box" }} />
          <button onClick={checkV2} disabled={!v2.trim() || loading2} style={{ ...ghostBtn, marginTop: 10, opacity: !v2.trim() || loading2 ? 0.5 : 1 }}>
            {loading2 ? "Проверяю…" : "Отправить на проверку"}
          </button>
          {work.feedback2 && <p style={{ fontFamily: bodyFont, fontSize: 12, color: T.inkSoft, marginTop: 10, whiteSpace: "pre-wrap" }}>{work.feedback2}</p>}
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   БИБЛИОТЕКА — категории + поиск
   ============================================================ */

function buildLibraryItems() {
  const items = [];
  [1, 2].forEach((id) => {
    const d = LESSON_CONTENT[id];
    d.terms.forEach((t) => items.push({ cat: "Словарь", title: t.term, body: t.def }));
    items.push({ cat: "Источники", title: `Урок ${id}: обязательные`, body: d.sources.required.join("; ") });
    items.push({ cat: "Источники", title: `Урок ${id}: дополнительные`, body: d.sources.additional.join("; ") });
  });
  items.push({ cat: "Шаблоны", title: "Бриф на контент", body: "Цель публикации:\nАудитория:\nГлавное сообщение:\nФормат и площадка:\nCTA:\nДедлайн:\nМетрика успеха:" });
  items.push({ cat: "Шаблоны", title: "Структура контент-плана", body: "Дата | Площадка | Рубрика | Тема | Формат | Цель | Ответственный | Статус" });
  items.push({ cat: "Чек-листы", title: "Чек-лист поста перед публикацией", body: "☐ Соответствует Tone of Voice\n☐ Есть чёткий CTA\n☐ Заголовок цепляет за 3 секунды\n☐ Нет канцелярита\n☐ Факты проверены" });
  return items;
}

function LibraryScreen({ notes }) {
  const [cat, setCat] = useState("Все");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(null);
  const items = useMemo(() => buildLibraryItems(), []);
  const cats = ["Все", "Словарь", "Шаблоны", "Чек-листы", "Источники", "Заметки"];

  const withNotes = notes ? [...items, { cat: "Заметки", title: "Мои заметки", body: notes }] : items;
  const filtered = withNotes.filter((i) => (cat === "Все" || i.cat === cat) && (query === "" || (i.title + i.body).toLowerCase().includes(query.toLowerCase())));

  function copy(t) { navigator.clipboard?.writeText(t.body).catch(() => {}); setCopied(t.title); setTimeout(() => setCopied(null), 1500); }

  return (
    <div>
      <PageHeader eyebrow="Библиотека" title="Материалы и источники" />
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${cat === c ? T.ink : T.border}`,
            background: cat === c ? T.ink : T.surface, color: cat === c ? T.surface : T.inkSoft, fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{c}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, maxWidth: 320 }}>
        <Search size={15} color={T.inkFaint} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по библиотеке…"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: bodyFont, fontSize: 13, borderBottom: `1px solid ${T.border}`, padding: "4px 0" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {filtered.map((t) => (
          <Card key={t.cat + t.title}>
            <Pill tone="indigo">{t.cat}</Pill>
            <h3 style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 700, color: T.ink, margin: "12px 0 10px" }}>{t.title}</h3>
            <pre style={{ fontFamily: monoFont, fontSize: 11.5, color: T.inkSoft, background: T.surfaceSoft, padding: 12, borderRadius: 8,
              whiteSpace: "pre-wrap", lineHeight: 1.6, margin: "0 0 12px", maxHeight: 140, overflow: "auto" }}>{t.body}</pre>
            <button onClick={() => copy(t)} style={ghostBtn}>{copied === t.title ? <Check size={13} color={T.teal} /> : <Copy size={13} />} {copied === t.title ? "Скопировано" : "Скопировать"}</button>
          </Card>
        ))}
        {filtered.length === 0 && <p style={{ fontFamily: bodyFont, fontSize: 13, color: T.inkFaint }}>Ничего не найдено</p>}
      </div>
    </div>
  );
}

/* ============================================================
   КОРНЕВОЕ ПРИЛОЖЕНИЕ
   ============================================================ */

const DEFAULT_STATE = {
  profile: null, competencies: null, rawDiag: null,
  completedLessons: 0, points: 0, streak: 0, lastActive: null,
  practiceStore: {}, portfolio: {}, notes: "", history: [],
};


function MobileBottomNav({ screen, onNavigate }) {
  const items = [
    { key: "dashboard", label: "Главная", icon: Home },
    { key: "map", label: "Карта", icon: Map },
    { key: "portfolio", label: "Работы", icon: Briefcase },
    { key: "cabinet", label: "Кабинет", icon: User },
    { key: "library", label: "Библиотека", icon: Library },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Основная навигация">
      {items.map(({ key, label, icon: Icon }) => {
        const active = screen === key || (key === "map" && ["moduleOverview", "lesson"].includes(screen));
        return (
          <button
            key={key}
            type="button"
            className={`mobile-bottom-nav__item${active ? " active" : ""}`}
            onClick={() => onNavigate(key)}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState(DEFAULT_STATE);
  const [screen, setScreen] = useState("dashboard");
  const [stage, setStage] = useState("boot"); // boot | onboarding | diagnostic | app

  useEffect(() => {
    (() => {
      const s = loadAcademyState();
      if (s && s.profile && s.competencies) {
        const today = new Date().toISOString().slice(0, 10);
        let streak = s.streak || 0;
        if (s.lastActive) {
          const diffDays = Math.round((new Date(today) - new Date(s.lastActive)) / 86400000);
          if (diffDays === 1) streak += 1; else if (diffDays > 1) streak = 1;
        } else streak = 1;
        setState({ ...DEFAULT_STATE, ...s, streak, lastActive: today });
        setStage("app");
      } else if (s && s.profile && !s.competencies) {
        setState({ ...DEFAULT_STATE, ...s });
        setStage("diagnostic");
      } else {
        setStage("onboarding");
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) saveAcademyState(state); }, [state, loaded]);

  function pushHistory(text) {
    const today = new Date().toISOString().slice(0, 10);
    setState((s) => ({ ...s, history: [...(s.history || []), { date: today, text }] }));
  }

  function handleOnboardFinish(profile) {
    setState((s) => ({ ...s, profile }));
    setStage("diagnostic");
  }
  function handleDiagnosticComplete({ competencies, rawDiag }) {
    setState((s) => ({ ...s, competencies, rawDiag, points: s.points + 20 }));
    pushHistory("Пройдена входная диагностика");
    setStage("app");
    setScreen("dashboard");
  }
  function handleLessonComplete(lessonId, score, total) {
    setState((s) => ({
      ...s,
      completedLessons: Math.max(s.completedLessons, lessonId),
      points: s.points + 30 + score * 5,
    }));
    pushHistory(`Завершён урок ${lessonId} (тест ${score}/${total})`);
    setScreen("moduleOverview");
  }
  function handlePracticeSave(lessonKey, level, value) {
    setState((s) => ({ ...s, practiceStore: { ...s.practiceStore, [lessonKey]: { ...(s.practiceStore[lessonKey] || {}), [level]: value } } }));
  }
  function handlePortfolioSave(work) {
    setState((s) => ({ ...s, portfolio: { ...s.portfolio, module1FinalWork: work } }));
  }

  const userContext = state.profile ? `${state.profile.position || "специалист по коммуникациям"} в ${state.profile.company}, сфера — ${state.profile.sphere}. Ключевые направления: ${(state.profile.directions || []).join(", ")}.` : "";

  if (!loaded || stage === "boot") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <Loader2 size={22} color={T.inkFaint} />
      </div>
    );
  }

  if (stage === "onboarding") {
    return <div style={{ fontFamily: bodyFont }}><style>{FONTS}</style><Onboarding onFinish={handleOnboardFinish} /></div>;
  }
  if (stage === "diagnostic") {
    return <div style={{ fontFamily: bodyFont }}><style>{FONTS}</style><Onboard_Diagnostic_Flow onComplete={handleDiagnosticComplete} /></div>;
  }


  return (
    <div className="academy-shell" style={{ fontFamily: bodyFont, background: T.bg, minHeight: "100vh", display: "flex", width: "100%", overflowX: "hidden" }}>
      <style>{FONTS}</style>
      <style>{`
        @keyframes v6FadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .lesson-page-v6 { animation: v6FadeUp .35s ease both; }
        .v6-visual-map { margin: -8px 0 24px; }
        .v6-stage-row { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; margin-bottom: 10px; }
        .v6-stage { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 12px; border: 1px solid ${T.border}; border-radius: 14px; background: ${T.surface}; color: ${T.inkFaint}; cursor: pointer; font: 700 12px ${bodyFont}; box-shadow: 0 7px 18px rgba(24,28,54,.04); }
        .v6-stage span { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border-radius: 9px; background: ${T.surfaceSoft}; }
        .v6-stage.active { background: ${T.ink}; color: ${T.surface}; border-color: ${T.ink}; box-shadow: 0 10px 22px rgba(24,28,54,.16); }
        .v6-stage.done { color: ${T.teal}; border-color: ${T.teal}55; }
        .v6-flow-row { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 8px; }
        .v6-flow-step { position: relative; min-height: 68px; padding: 12px 14px; border-radius: 15px; background: linear-gradient(180deg, ${T.surface}, ${T.surfaceSoft}); border: 1px solid ${T.border}; box-shadow: 0 8px 20px rgba(24,28,54,.04); }
        .v6-flow-step span { display: block; font: 700 9px ${monoFont}; color: ${T.inkFaint}; letter-spacing: .08em; }
        .v6-flow-step strong { display: block; margin-top: 7px; font: 700 12px ${bodyFont}; color: ${T.ink}; }
        .v6-flow-step svg { position: absolute; right: -11px; top: 26px; z-index: 2; color: ${T.gold}; background: ${T.bg}; border-radius: 50%; }
        .lesson-page-v6 button { transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
        .lesson-page-v6 button:hover:not(:disabled) { transform: translateY(-1px); }
        .lesson-page-v6 textarea:focus { outline: 2px solid ${T.gold}; outline-offset: 1px; }
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { width: 100%; max-width: 100%; overflow-x: hidden; }
        img, svg, video, canvas { max-width: 100%; }
        .academy-main > * { min-width: 0; max-width: 100%; }
        .lesson-page-v6 { width: 100%; max-width: 960px !important; min-width: 0; }
        .lesson-page-v6 > * { min-width: 0; max-width: 100%; }
        .lesson-page-v6 table { max-width: 100%; }
        .mobile-bottom-nav { display: none; }

        @media (max-width: 760px) {
          .academy-shell { display: block !important; width: 100% !important; }
          .academy-shell > aside { display: none !important; }
          .mobile-bottom-nav {
            position: fixed;
            left: 10px;
            right: 10px;
            bottom: max(10px, env(safe-area-inset-bottom));
            z-index: 1000;
            display: grid !important;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 4px;
            padding: 7px;
            border: 1px solid ${T.border};
            border-radius: 20px;
            background: color-mix(in srgb, ${T.surface} 94%, transparent);
            box-shadow: 0 16px 40px rgba(24, 28, 54, .18);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }
          .mobile-bottom-nav__item {
            min-width: 0;
            min-height: 54px;
            padding: 7px 2px 6px;
            border: 0;
            border-radius: 14px;
            background: transparent;
            color: ${T.inkFaint};
            font-family: ${bodyFont};
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
          }
          .mobile-bottom-nav__item span {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 9px;
            font-weight: 700;
            line-height: 1;
          }
          .mobile-bottom-nav__item.active {
            background: ${T.ink};
            color: ${T.surface};
          }
          .academy-main {
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            padding: 16px 14px 92px !important;
            margin: 0 !important;
            overflow-x: hidden !important;
          }
          .dashboard-page, .cabinet-page {
            width: 100%;
            min-width: 0;
            max-width: 100%;
          }
          .dashboard-hero-grid, .cabinet-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            width: 100%;
            min-width: 0;
          }
          .dashboard-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            width: 100%;
            min-width: 0;
          }
          .dashboard-page > *, .cabinet-page > *,
          .dashboard-hero-grid > *, .dashboard-stats-grid > *, .cabinet-grid > * {
            min-width: 0;
            max-width: 100%;
          }
          .cabinet-page [style*="justify-content: space-between"] { gap: 10px; }
          .cabinet-page [style*="justify-content: space-between"] > span {
            min-width: 0;
            overflow-wrap: anywhere;
          }
          .lesson-page-v6 { width: 100% !important; max-width: 100% !important; }
          .lesson-page-v6 section { max-width: 100%; }
          .lesson-page-v6 h1 { font-size: clamp(28px, 9vw, 38px) !important; overflow-wrap: anywhere; }
          .lesson-page-v6 h2 { font-size: clamp(23px, 7vw, 29px) !important; overflow-wrap: anywhere; }
          .lesson-page-v6 h3 { overflow-wrap: anywhere; }
          .lesson-page-v6 p,
          .lesson-page-v6 li,
          .lesson-page-v6 strong,
          .lesson-page-v6 span { overflow-wrap: anywhere; word-break: normal; }

          .v6-stage-row { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; }
          .v6-stage { min-width: 0; padding: 10px 8px; font-size: 11px; }
          .v6-flow-row { grid-template-columns: 1fr; gap: 7px; }
          .v6-flow-step { min-height: 56px; }
          .v6-flow-step svg { display: none; }

          /* React converts inline style names to kebab-case in the DOM. */
          .lesson-page-v6 [style*="grid-template-columns"] {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .lesson-page-v6 [style*="display: grid"] { min-width: 0; }
          .lesson-page-v6 [style*="display: flex"] { min-width: 0; max-width: 100%; }
          .lesson-page-v6 [style*="position: sticky"] {
            position: static !important;
            top: auto !important;
          }

          /* Compact lesson tabs remain usable without stretching the viewport. */
          .lesson-page-v6 > div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .lesson-page-v6 button {
            max-width: 100%;
            min-height: 44px;
            white-space: normal;
          }
          .lesson-page-v6 textarea,
          .lesson-page-v6 input,
          .lesson-page-v6 select {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            font-size: 16px !important;
          }
          .lesson-page-v6 table {
            display: block;
            width: 100% !important;
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .lesson-page-v6 td,
          .lesson-page-v6 th {
            min-width: 140px;
            white-space: normal;
          }
        }

        @media (max-width: 390px) {
          .academy-main { padding-left: 10px !important; padding-right: 10px !important; }
          .dashboard-stats-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .v6-stage-row { grid-template-columns: 1fr; }
          .lesson-page-v6 > div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <AppSidebar screen={screen} streak={state.streak} onNavigate={setScreen} />
      <main className="academy-main" style={{ flex: 1, minWidth: 0, width: "100%", padding: "32px 40px", maxWidth: 980, overflowX: "hidden", boxSizing: "border-box" }}>
        {screen === "dashboard" && <Dashboard state={state} onGoLesson={(id) => { setState((s) => ({ ...s, _openLesson: id })); setScreen("lesson"); }} onGoModule={() => setScreen("moduleOverview")} />}
        {screen === "map" && <CourseMap completedLessons={state.completedLessons} onOpenModule1={() => setScreen("moduleOverview")} />}
        {screen === "moduleOverview" && <ModuleOverview completedCount={state.completedLessons} competencies={state.competencies || []} onOpenLesson={(id) => { setState((s) => ({ ...s, _openLesson: id })); setScreen("lesson"); }} />}
        {screen === "lesson" && (
          <Lesson
            lessonId={state._openLesson || Math.min(state.completedLessons + 1, 8)}
            onComplete={handleLessonComplete}
            nextLabel={state._openLesson < 8 ? `К уроку ${state._openLesson + 1}` : "К обзору модуля"}
            onBack={() => setScreen("moduleOverview")}
            practiceStore={state.practiceStore}
            onPracticeSave={handlePracticeSave}
            userContext={userContext}
          />
        )}
        {screen === "cabinet" && <Cabinet state={state} onUpdateProfile={(p) => setState((s) => ({ ...s, profile: p }))} onUpdateNotes={(n) => setState((s) => ({ ...s, notes: n }))} />}
        {screen === "portfolio" && <Portfolio state={state} onSaveWork={handlePortfolioSave} userContext={userContext} />}
        {screen === "library" && <LibraryScreen notes={state.notes} />}
      </main>
      <MobileBottomNav screen={screen} onNavigate={setScreen} />
    </div>
  );
}