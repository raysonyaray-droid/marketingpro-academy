import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Lightbulb, RotateCcw, Trophy, X } from "lucide-react";

const C = {
  bg: "#EEF1F6", surface: "#FFFFFF", soft: "#F5F7FB", ink: "#161A2E", muted: "#5B617A",
  faint: "#8A90AC", border: "#DFE3ED", gold: "#E7A33E", goldSoft: "#FBEBD1",
  teal: "#2F7A63", tealSoft: "#DCEFE7", berry: "#B23A56", berrySoft: "#F6DEE3",
  indigo: "#3B4A9E", indigoSoft: "#E4E7F7",
};

const LESSON = {
  id: 1,
  title: "Почему маркетинг вообще появился?",
  eyebrow: "Модуль 1 · Урок 1",
  duration: "45–55 минут",
  outcomes: [
    "Отличать отдельные маркетинговые практики от маркетинга как системы управления",
    "Объяснять, почему масштаб и неопределённость спроса меняют работу компании",
    "Находить маркетинговые задачи там, где их ошибочно сводят только к рекламе",
  ],
  steps: [
    {
      type: "challenge",
      label: "Вызов",
      title: "Пока владелец знает каждого клиента, маркетинг почти незаметен",
      text: "Представьте небольшую пекарню. Владелец сам стоит за прилавком, знает постоянных покупателей, меняет ассортимент по их просьбам и лично объясняет, чем сегодняшний хлеб отличается от вчерашнего. Пекарня открывает третью точку. Владелец больше не видит большинство покупателей и не может лично передавать знания каждому сотруднику.",
      question: "Что стало главной причиной появления новых маркетинговых задач?",
      options: [
        { text: "Компания стала тратить больше денег", feedback: "Рост затрат важен, но сам по себе не объясняет необходимость маркетинга." },
        { text: "Исчезло личное знание клиента, а рынок стал сложнее и менее предсказуемым", correct: true, feedback: "Верно. Масштаб создаёт дистанцию между компанией и покупателем. Её приходится компенсировать данными, сегментацией, стандартами и системой решений." },
        { text: "Появилась необходимость завести социальные сети", feedback: "Социальные сети — только один из каналов. Маркетинговая проблема возникла раньше выбора канала." },
        { text: "Конкуренты начали делать рекламу", feedback: "Конкуренция усиливает проблему, но ключевое изменение — потеря прямого знания клиента и рост неопределённости." },
      ],
    },
    {
      type: "theory",
      label: "Теория 1",
      title: "Практики маркетинга существовали задолго до профессии маркетолога",
      paragraphs: [
        "Люди торговались, заботились о репутации, меняли продукт под спрос, выбирали место торговли и использовали знаки, упаковку и рекомендации задолго до появления университетских курсов по маркетингу.",
        "Поэтому фраза «раньше маркетинга не было» неточна. Не было маркетинга как отдельной управленческой дисциплины, но были отдельные действия, которые сегодня относятся к маркетингу.",
      ],
      callout: "Ключевое различие: отдельный приём может существовать сам по себе. Маркетинг как система связывает исследование, выбор клиента, ценность, продукт, цену, каналы и коммуникацию в единую логику.",
    },
    {
      type: "classify",
      label: "Мини-практика",
      title: "Практика или система?",
      instruction: "Отнесите каждое действие к отдельной практике или к системному маркетинговому управлению.",
      cards: [
        { text: "Продавец запоминает, какой хлеб обычно покупает постоянный клиент", bucket: "practice" },
        { text: "Сеть собирает данные по точкам и меняет ассортимент для разных районов", bucket: "system" },
        { text: "Купец использует узнаваемый знак на лавке", bucket: "practice" },
        { text: "Компания выбирает приоритетный сегмент и под него меняет продукт, цену и сообщение", bucket: "system" },
      ],
    },
    {
      type: "timeline",
      label: "Контекст",
      title: "Что изменилось с ростом рынков",
      items: [
        { era: "Локальная торговля", text: "Производитель и покупатель часто знают друг друга. Обратная связь непосредственная." },
        { era: "Индустриализация", text: "Производство растёт быстрее, ассортимент и объёмы увеличиваются." },
        { era: "Массовое распределение", text: "Товар проходит через посредников, транспорт и широкую сеть продаж." },
        { era: "Насыщенные рынки", text: "Покупатель выбирает из альтернатив, а компания не может считать спрос гарантированным." },
        { era: "Современный маркетинг", text: "Организация системно изучает рынок и координирует решения вокруг выбранной ценности для клиента." },
      ],
    },
    {
      type: "theory",
      label: "Теория 2",
      title: "Масштаб создаёт неопределённость",
      paragraphs: [
        "Когда компания обслуживает десятки знакомых покупателей, руководитель получает обратную связь почти автоматически. При росте число клиентов увеличивается, они становятся неоднородными, а решения начинают принимать разные подразделения.",
        "Теперь компания должна отдельно выяснять, кто покупатель, что для него важно, почему он выбирает альтернативу, какую цену считает оправданной и где ожидает получить продукт. Это и есть управленческая задача, а не задача одной рекламной функции.",
      ],
      callout: "Маркетинг становится особенно заметен там, где организация больше не может полагаться на интуицию одного владельца и гарантированный спрос.",
    },
    {
      type: "case",
      label: "Большой кейс",
      title: "Сеть пекарен растёт, но продажи новых точек ниже плана",
      text: "Руководитель предлагает увеличить рекламный бюджет. Команда знает, что в каждой точке разная аудитория, но ассортимент, цены и сообщения одинаковы. Данные о покупках не анализируются, отзывы собираются бессистемно.",
      question: "Какой первый шаг наиболее обоснован?",
      options: [
        { text: "Запустить больше рекламы с сообщением «лучший хлеб в городе»", feedback: "Это усиливает коммуникацию до того, как компания поняла причину слабого спроса." },
        { text: "Собрать данные по точкам, изучить различия спроса и проверить соответствие ассортимента каждой локации", correct: true, feedback: "Верно. Сначала снижаем неопределённость, затем меняем предложение и только после этого масштабируем коммуникацию." },
        { text: "Сделать скидку во всех точках", feedback: "Скидка может временно поднять спрос, но не объяснит, почему предложение не соответствует аудитории." },
        { text: "Закрыть точки с низкими продажами", feedback: "Это преждевременное решение без диагностики причин." },
      ],
    },
    {
      type: "work",
      label: "Связь с работой",
      title: "Почему фармацевтическая логистика — это не только продвижение",
      text: "В B2B клиент оценивает не красивое сообщение само по себе, а способность компании снизить риск: обеспечить сроки, сохранность груза, корректность документов, прозрачность маршрута и управляемость исключений.",
      prompts: [
        "Какие данные нужно собирать, чтобы понимать критерии выбора клиента?",
        "Какие элементы услуги создают ценность до начала коммуникационной кампании?",
        "Какие обещания нельзя использовать, пока они не подтверждены процессом?",
      ],
    },
    {
      type: "quiz",
      label: "Проверка",
      title: "Проверьте, удержалась ли логика урока",
      questions: [
        {
          q: "Что точнее всего отличает маркетинговую практику от маркетинга как системы?",
          options: [
            "Практика всегда связана с рекламой",
            "Система связывает решения о клиенте, ценности, продукте, цене, каналах и коммуникации",
            "Система существует только в крупных компаниях",
            "Практики появились после формирования дисциплины",
          ], answer: 1,
          explain: "Система объединяет решения и подчиняет их выбранной логике создания ценности, а не просто набору отдельных действий.",
        },
        {
          q: "Почему масштабирование усиливает потребность в маркетинге?",
          options: [
            "Потому что любая крупная компания обязана больше рекламироваться",
            "Потому что исчезает личное знание клиента и растёт неопределённость спроса",
            "Потому что продукт автоматически становится хуже",
            "Потому что цены всегда приходится снижать",
          ], answer: 1,
          explain: "Главное изменение — дистанция между компанией и покупателем, которую нужно компенсировать исследованием и системой решений.",
        },
        {
          q: "Что следует делать до увеличения рекламного бюджета при слабых продажах новой точки?",
          options: [
            "Проверить спрос, аудиторию, предложение и причины несоответствия",
            "Сделать сообщение эмоциональнее",
            "Скопировать рекламу лидера рынка",
            "Увеличить частоту публикаций",
          ], answer: 0,
          explain: "Коммуникация не исправляет неясную аудиторию или неподходящее предложение. Сначала нужна диагностика.",
        },
      ],
    },
    {
      type: "reflection",
      label: "Закрепление",
      title: "Переведите идею урока в свою работу",
      prompt: "Назовите один процесс в вашей работе, который сейчас держится на личном знании отдельных людей. Что потребуется, если этот процесс придётся масштабировать?",
    },
    {
      type: "summary",
      label: "Финиш",
      title: "Главная мысль урока",
      bullets: [
        "Маркетинговые практики существовали задолго до маркетинга как дисциплины.",
        "Маркетинг оформился как система управления по мере роста масштаба, конкуренции и неопределённости спроса.",
        "Реклама — лишь один из инструментов. До неё идут понимание клиента, выбор ценности и настройка предложения.",
        "В B2B маркетинг часто снижает неопределённость и риск для клиента, а не просто повышает узнаваемость.",
      ],
    },
  ],
};

function Shell({ children }) {
  return <div style={{ maxWidth: 760, margin: "0 auto" }}>{children}</div>;
}

function Button({ children, onClick, disabled, secondary = false }) {
  return <button disabled={disabled} onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "12px 18px", borderRadius: 12, border: secondary ? `1px solid ${C.border}` : "none",
    background: secondary ? C.surface : C.ink, color: secondary ? C.ink : C.surface,
    fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer", opacity: disabled ? .45 : 1,
  }}>{children}</button>;
}

function Card({ children, tone = "plain" }) {
  const backgrounds = { plain: C.surface, indigo: C.indigoSoft, gold: C.goldSoft, teal: C.tealSoft, berry: C.berrySoft };
  return <div style={{ background: backgrounds[tone], border: tone === "plain" ? `1px solid ${C.border}` : "none", borderRadius: 20, padding: 24 }}>{children}</div>;
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: C.faint, marginBottom: 8 }}>{children}</div>;
}

function Choice({ text, selected, state, onClick }) {
  const border = state === "right" ? C.teal : state === "wrong" ? C.berry : selected ? C.ink : C.border;
  const bg = state === "right" ? C.tealSoft : state === "wrong" ? C.berrySoft : selected ? C.soft : C.surface;
  return <button onClick={onClick} style={{ width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 12,
    border: `1.5px solid ${border}`, background: bg, color: C.ink, fontSize: 14, lineHeight: 1.45, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
    <span>{text}</span>{state === "right" ? <CheckCircle2 size={18} color={C.teal} /> : state === "wrong" ? <X size={18} color={C.berry} /> : null}
  </button>;
}

function StepBody({ step, answers, setAnswers }) {
  const key = answers.stepKey;
  if (step.type === "challenge" || step.type === "case") {
    const picked = answers[key]?.picked;
    const checked = answers[key]?.checked;
    const selected = step.options[picked];
    return <Card tone={step.type === "challenge" ? "indigo" : "gold"}>
      <Label>{step.label}</Label><h2 style={h2}>{step.title}</h2><p style={p}>{step.text}</p>
      <div style={{ fontWeight: 700, margin: "20px 0 12px", color: C.ink }}>{step.question}</div>
      <div style={{ display: "grid", gap: 10 }}>{step.options.map((o, i) => <Choice key={o.text} text={o.text} selected={picked === i}
        state={checked && o.correct ? "right" : checked && picked === i && !o.correct ? "wrong" : undefined}
        onClick={() => !checked && setAnswers((a) => ({ ...a, [key]: { picked: i, checked: false } }))} />)}</div>
      {checked && <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: C.surface }}>
        <strong style={{ color: selected?.correct ? C.teal : C.berry }}>{selected?.correct ? "Верно" : "Нужно скорректировать логику"}</strong>
        <p style={{ ...p, margin: "6px 0 0", fontSize: 13 }}>{selected?.feedback}</p>
      </div>}
      {!checked && <div style={{ marginTop: 16 }}><Button disabled={picked === undefined} onClick={() => setAnswers((a) => ({ ...a, [key]: { ...a[key], checked: true } }))}>Проверить</Button></div>}
    </Card>;
  }

  if (step.type === "theory") return <Card><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2>
    {step.paragraphs.map((x) => <p key={x} style={p}>{x}</p>)}
    <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: C.soft, display: "flex", gap: 12 }}><Lightbulb size={20} color={C.gold} /><p style={{ ...p, margin: 0, fontSize: 13 }}>{step.callout}</p></div>
  </Card>;

  if (step.type === "classify") {
    const state = answers[key] || {};
    const complete = Object.keys(state).length === step.cards.length;
    return <Card><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2><p style={p}>{step.instruction}</p>
      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>{step.cards.map((card, i) => <div key={card.text} style={{ padding: 16, border: `1px solid ${C.border}`, borderRadius: 14 }}>
        <div style={{ fontSize: 14, lineHeight: 1.45, color: C.ink, marginBottom: 12 }}>{card.text}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[['practice','Отдельная практика'],['system','Система']].map(([v,l]) => {
            const chosen = state[i] === v; const good = chosen && v === card.bucket;
            return <button key={v} onClick={() => setAnswers((a) => ({ ...a, [key]: { ...(a[key] || {}), [i]: v } }))}
              style={{ padding: "8px 10px", borderRadius: 9, border: `1px solid ${chosen ? (good ? C.teal : C.berry) : C.border}`,
                background: chosen ? (good ? C.tealSoft : C.berrySoft) : C.surface, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{l}</button>;
          })}
        </div>
      </div>)}</div>
      {complete && <p style={{ ...p, marginTop: 16, color: C.teal, fontSize: 13 }}>Проверьте логику: отдельная практика решает локальную задачу, система связывает несколько решений вокруг выбранного клиента и ценности.</p>}
    </Card>;
  }

  if (step.type === "timeline") return <Card><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2>
    <div style={{ marginTop: 18 }}>{step.items.map((item, i) => <div key={item.era} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><div style={{ width: 12, height: 12, borderRadius: 99, background: i === step.items.length - 1 ? C.gold : C.ink }} />{i < step.items.length - 1 && <div style={{ width: 2, minHeight: 58, background: C.border }} />}</div>
      <div style={{ paddingBottom: 18 }}><div style={{ fontWeight: 800, color: C.ink }}>{item.era}</div><p style={{ ...p, margin: "5px 0 0", fontSize: 13 }}>{item.text}</p></div>
    </div>)}</div>
  </Card>;

  if (step.type === "work") return <Card tone="teal"><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2><p style={p}>{step.text}</p>
    <div style={{ display: "grid", gap: 10, marginTop: 16 }}>{step.prompts.map((q) => <div key={q} style={{ background: C.surface, borderRadius: 12, padding: 14, display: "flex", gap: 10 }}><CircleHelp size={18} color={C.teal} /><span style={{ fontSize: 13, lineHeight: 1.45 }}>{q}</span></div>)}</div>
  </Card>;

  if (step.type === "quiz") {
    const state = answers[key] || {};
    return <Card><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2><div style={{ display: "grid", gap: 18, marginTop: 18 }}>
      {step.questions.map((q, qi) => { const chosen = state[qi]; return <div key={q.q} style={{ paddingBottom: 18, borderBottom: qi < step.questions.length - 1 ? `1px solid ${C.border}` : "none" }}>
        <div style={{ fontWeight: 750, lineHeight: 1.45, marginBottom: 10 }}>{qi + 1}. {q.q}</div>
        <div style={{ display: "grid", gap: 8 }}>{q.options.map((o, oi) => <Choice key={o} text={o} selected={chosen === oi}
          state={chosen === undefined ? undefined : oi === q.answer ? "right" : chosen === oi ? "wrong" : undefined}
          onClick={() => chosen === undefined && setAnswers((a) => ({ ...a, [key]: { ...(a[key] || {}), [qi]: oi } }))} />)}</div>
        {chosen !== undefined && <p style={{ ...p, fontSize: 13, marginTop: 10 }}>{q.explain}</p>}
      </div>; })}
    </div></Card>;
  }

  if (step.type === "reflection") return <Card tone="indigo"><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2><p style={p}>{step.prompt}</p>
    <textarea value={answers[key] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))} placeholder="Запишите 3–5 предложений"
      style={{ width: "100%", minHeight: 130, marginTop: 14, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14, boxSizing: "border-box", resize: "vertical", font: "inherit", lineHeight: 1.5 }} />
  </Card>;

  if (step.type === "summary") return <Card tone="gold"><div style={{ width: 58, height: 58, borderRadius: 99, background: C.surface, display: "grid", placeItems: "center", marginBottom: 16 }}><Trophy color={C.gold} /></div>
    <Label>{step.label}</Label><h2 style={h2}>{step.title}</h2><ul style={{ margin: "16px 0 0", paddingLeft: 20, color: C.ink, lineHeight: 1.75 }}>{step.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
  </Card>;
  return null;
}

const h2 = { fontFamily: "Fraunces, serif", fontSize: 27, lineHeight: 1.18, color: C.ink, margin: "0 0 12px", fontWeight: 650 };
const p = { color: C.muted, fontSize: 15, lineHeight: 1.68, margin: "0 0 12px" };

export default function StepLesson({ onBack, onComplete, nextLabel, onPracticeSave }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const step = LESSON.steps[index];
  const stepKey = `step_${index}`;
  const progress = Math.round(((index + 1) / LESSON.steps.length) * 100);
  const enriched = useMemo(() => ({ ...answers, stepKey }), [answers, stepKey]);

  function finish() {
    const quizStep = LESSON.steps.find((s) => s.type === "quiz");
    const quizIndex = LESSON.steps.findIndex((s) => s.type === "quiz");
    const quizAnswers = answers[`step_${quizIndex}`] || {};
    const score = quizStep.questions.reduce((sum, q, i) => sum + (quizAnswers[i] === q.answer ? 1 : 0), 0);
    const reflectionIndex = LESSON.steps.findIndex((s) => s.type === "reflection");
    const reflection = answers[`step_${reflectionIndex}`] || "";
    onPracticeSave?.("l1", "reflection", { answer: reflection, feedback: "" });
    onComplete(1, score, quizStep.questions.length, reflection);
  }

  return <Shell>
    <button onClick={onBack} style={{ border: "none", background: "transparent", color: C.muted, display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: 0, marginBottom: 22, fontWeight: 700 }}><ArrowLeft size={16} /> К обзору модуля</button>
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", marginBottom: 10 }}>
        <div><div style={{ fontSize: 12, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: .8 }}>{LESSON.eyebrow}</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, lineHeight: 1.08, margin: "5px 0 6px", color: C.ink }}>{LESSON.title}</h1>
          <div style={{ fontSize: 13, color: C.faint }}>{LESSON.duration}</div></div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{progress}%</div>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: C.border, overflow: "hidden" }}><div style={{ width: `${progress}%`, height: "100%", background: C.gold, transition: "width .25s ease" }} /></div>
    </div>

    {index === 0 && <Card><Label>После урока вы сможете</Label><ul style={{ margin: "10px 0 0", paddingLeft: 20, lineHeight: 1.75, color: C.ink }}>{LESSON.outcomes.map((x) => <li key={x}>{x}</li>)}</ul></Card>}
    <div style={{ marginTop: 16 }}><StepBody step={step} answers={enriched} setAnswers={setAnswers} /></div>

    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 18 }}>
      <Button secondary disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}><ArrowLeft size={16} /> Назад</Button>
      {index < LESSON.steps.length - 1 ? <Button onClick={() => setIndex((i) => i + 1)}>Продолжить <ArrowRight size={16} /></Button>
        : <div style={{ display: "flex", gap: 8 }}><Button secondary onClick={() => { setIndex(0); setAnswers({}); }}><RotateCcw size={16} /> Пройти заново</Button><Button onClick={finish}>{nextLabel} <ArrowRight size={16} /></Button></div>}
    </div>
  </Shell>;
}
