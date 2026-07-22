import { useMemo, useState } from "react";
import { LESSON_CONTENT, MODULE1_LESSON_META } from "./data/lessons/module1";
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


const LESSON_2 = {
  id: 2,
  title: "Как менялась логика маркетинга",
  eyebrow: "Модуль 1 · Урок 2",
  duration: "45–55 минут",
  outcomes: [
    "Различать производственную, товарную, сбытовую и маркетинговую ориентации",
    "Распознавать маркетинговую близорукость в рабочих решениях",
    "Понимать, почему разные ориентации могут сосуществовать в одной компании",
  ],
  steps: [
    {
      type: "challenge", label: "Вызов", title: "Хороший продукт сам себя не продаёт",
      text: "Компания улучшает технические характеристики сервиса, но клиенты всё чаще выбирают более простого конкурента. Руководство отвечает новым циклом доработок и усилением отдела продаж.",
      question: "В чём наиболее вероятная управленческая ошибка?",
      options: [
        { text: "Компания слишком мало говорит о характеристиках", feedback: "Возможно, но проблема глубже: характеристики могут не соответствовать главной задаче клиента." },
        { text: "Компания определяет ценность через продукт, а не через задачу клиента", correct: true, feedback: "Верно. Это типичный риск товарной ориентации и маркетинговой близорукости." },
        { text: "Компания недостаточно быстро производит", feedback: "Скорость производства не объясняет, почему покупатели выбирают более простую альтернативу." },
        { text: "Нужно немедленно снизить цену", feedback: "Снижение цены без понимания причины выбора может только уменьшить маржу." },
      ],
    },
    {
      type: "theory", label: "Теория 1", title: "Ориентация компании — это логика принятия решений",
      paragraphs: [
        "Производственная ориентация ставит в центр эффективность, доступность и масштаб. Товарная — характеристики и качество продукта. Сбытовая — активное стимулирование сделки. Маркетинговая — выбранную аудиторию и ценность, которую компания создаёт для неё.",
        "Это не четыре строгие исторические эпохи. В одной компании они могут сосуществовать: производство отвечает за эффективность, продукт — за качество, продажи — за сделку. Вопрос в том, какая логика становится главной при спорном решении.",
      ],
      callout: "Проблема начинается не с эффективности, качества или продаж самих по себе, а когда один критерий становится единственным и вытесняет понимание клиента.",
    },
    {
      type: "classify", label: "Мини-практика", title: "Какая логика доминирует?",
      instruction: "Отнесите ситуацию к фокусу на продукте или к фокусу на задаче клиента.",
      cards: [
        { text: "Команда добавляет функции, потому что конкуренты уже добавили их", bucket: "practice" },
        { text: "Перед доработкой команда проверяет, какую проблему клиента решит новая функция", bucket: "system" },
        { text: "Презентация перечисляет только технические характеристики услуги", bucket: "practice" },
        { text: "Предложение связывает характеристики со сроками, рисками и усилиями клиента", bucket: "system" },
      ],
    },
    {
      type: "timeline", label: "Четыре ориентации", title: "Как меняется главный вопрос компании",
      items: [
        { era: "Производственная", text: "Как сделать продукт доступнее, быстрее и дешевле в производстве?" },
        { era: "Товарная", text: "Как сделать продукт лучше по характеристикам и качеству?" },
        { era: "Сбытовая", text: "Как убедить покупателя совершить сделку сейчас?" },
        { era: "Маркетинговая", text: "Для кого мы создаём ценность и какую задачу решаем лучше альтернатив?" },
        { era: "Холистическая", text: "Как связать клиента, сотрудников, партнёров, процессы и общественную ответственность в единую систему?" },
      ],
    },
    {
      type: "theory", label: "Теория 2", title: "Маркетинговая близорукость: улучшать продукт и всё равно терять рынок",
      paragraphs: [
        "Маркетинговая близорукость возникает, когда компания определяет свой бизнес через текущий продукт, а не через задачу клиента. Тогда она может последовательно улучшать то, что постепенно перестаёт быть лучшим способом решения этой задачи.",
        "Противоядие — регулярно проверять не только удовлетворённость текущим продуктом, но и альтернативные способы, которыми клиент решает ту же задачу.",
      ],
      callout: "Клиент покупает не склад, перевозку или публикацию как таковые. Он покупает доступность товара, снижение риска, предсказуемость, экономию времени или другой результат.",
    },
    {
      type: "case", label: "Кейс BIOCARD", title: "Красивое сообщение не исправляет слабый процесс",
      text: "Сотрудникам нужно объяснить организационное изменение. Команда готовит яркую коммуникацию, но причины изменения не раскрыты, процесс не упрощён, а вопросы сотрудников не собраны.",
      question: "Какая логика здесь доминирует?",
      options: [
        { text: "Маркетинговая: компания изучила аудиторию и изменила ценность", feedback: "Нет: аудитория и причины сопротивления не исследованы." },
        { text: "Сбытовая: упор на убеждение вместо устранения причины и настройки процесса", correct: true, feedback: "Верно. Коммуникация пытается продать решение, не меняя его сути и не снижая неопределённость сотрудников." },
        { text: "Производственная: компания увеличивает выпуск", feedback: "Ситуация не связана с масштабом производства." },
        { text: "Холистическая: все функции уже согласованы", feedback: "Наоборот, связь между процессом, руководителями и коммуникацией отсутствует." },
      ],
    },
    {
      type: "work", label: "Связь с работой", title: "Проверьте ориентацию по реальному решению",
      text: "Выберите недавнее решение вашей команды. Не смотрите на декларации — восстановите фактическую логику выбора.",
      prompts: [
        "Какой критерий был главным: эффективность, качество продукта, объём продаж или ценность для выбранной аудитории?",
        "Какие данные о клиенте или сотруднике использовались?",
        "Что изменилось бы в решении при более сильной маркетинговой ориентации?",
      ],
    },
    {
      type: "quiz", label: "Проверка", title: "Закрепите различия между ориентациями",
      questions: [
        { q: "Что характеризует товарную ориентацию?", options: ["Фокус на характеристиках и качестве продукта", "Фокус только на снижении цены", "Фокус на долгосрочных отношениях", "Фокус на общественной ответственности"], answer: 0, explain: "Товарная ориентация исходит из предположения, что лучший продукт будет выбран автоматически." },
        { q: "Что такое маркетинговая близорукость?", options: ["Недостаток рекламного бюджета", "Определение бизнеса через текущий продукт, а не задачу клиента", "Отказ от улучшения продукта", "Слишком широкая аудитория"], answer: 1, explain: "Компания может активно улучшать продукт, но не замечать, что клиент уже решает задачу иначе." },
        { q: "Могут ли производственная и маркетинговая ориентации сосуществовать?", options: ["Нет, они всегда противоречат", "Да, если эффективность не становится единственным критерием", "Только в малом бизнесе", "Только при отсутствии конкуренции"], answer: 1, explain: "Рыночная ориентация не отменяет эффективность — она связывает её с ценностью для клиента." },
        { q: "Какой вопрос ближе всего к маркетинговой ориентации?", options: ["Как продать больше любой ценой?", "Как сделать ещё больше функций?", "Для кого и какую задачу мы решаем лучше альтернатив?", "Как сократить обсуждение с клиентом?"], answer: 2, explain: "Маркетинговая ориентация начинается с выбранной аудитории, задачи и ценности." },
        { q: "Красивое сообщение без изменения слабого процесса — это риск какой логики?", options: ["Сбытовой", "Маркетинговой", "Холистической", "Исследовательской"], answer: 0, explain: "Убеждение подменяет работу с причиной и фактической ценностью." },
      ],
    },
    {
      type: "reflection", label: "Закрепление", title: "Определите доминирующую логику",
      prompt: "Вспомните одно решение вашей команды за последний месяц. Какая ориентация проявилась в нём сильнее всего и что вы бы изменили?",
    },
    {
      type: "summary", label: "Финиш", title: "Главная мысль урока",
      bullets: [
        "Ориентации — это логики решений, а не строгие исторические этапы.",
        "Эффективность, качество и продажи полезны, пока не вытесняют понимание клиента.",
        "Маркетинговая близорукость возникает при фокусе на продукте вместо задачи клиента.",
        "Маркетинговая ориентация связывает аудиторию, ценность и цели бизнеса.",
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

function buildLessonFromCatalog(lessonId) {
  const content = LESSON_CONTENT[lessonId];
  const meta = MODULE1_LESSON_META.find((item) => item.id === lessonId);
  if (!content || !meta) return LESSON;

  const steps = [
    {
      type: "challenge",
      label: "Стартовый кейс",
      title: meta.question,
      text: content.problemInput,
      question: "Что нужно сделать в первую очередь?",
      options: [
        { text: "Сразу выбрать канал или инструмент", feedback: "Инструмент выбирают после постановки задачи, анализа аудитории и определения ценности." },
        { text: "Сначала уточнить задачу, аудиторию, контекст и критерий результата", correct: true, feedback: "Верно. Это снижает риск преждевременного решения и связывает действие с реальной задачей." },
        { text: "Скопировать решение конкурента", feedback: "Чужое решение может быть не связано с вашим контекстом, аудиторией и ограничениями." },
        { text: "Увеличить объём коммуникации", feedback: "Больше коммуникации не исправляет неясную задачу или слабое предложение." },
      ],
    },
    ...content.theory.map((item, index) => ({
      type: "theory", label: `Теория ${index + 1}`, title: item.label, paragraphs: [item.text],
      callout: index === content.theory.length - 1 ? content.limitations : undefined,
    })),
  ];

  if (content.terms?.length) steps.push({ type: "terms", label: "Словарь", title: "Ключевые понятия урока", items: content.terms });
  if (content.comparison) steps.push({ type: "comparison", label: "Сравнение", ...content.comparison });

  const examples = content.examples ? Object.values(content.examples).filter(Boolean) : [];
  if (examples.length) {
    steps.push({
      type: "examples", label: "Разбор примеров", title: "Как это выглядит на практике", items: examples,
    });
  }

  if (content.practice) {
    steps.push({
      type: "practice", label: "Практика", title: "Примените модель к своей задаче",
      tasks: [content.practice.micro, content.practice.main, content.practice.advanced].filter(Boolean),
      solution: content.microcheck?.a || "Сильный ответ должен быть конкретным, опираться на понятия урока и показывать логику решения, а не только выбранный инструмент.",
    });
  }

  if (content.mistakes?.length) steps.push({ type: "mistakes", label: "Ошибки новичка", title: "Что чаще всего ломает логику", items: content.mistakes });
  if (content.microcheck) steps.push({
    type: "microcheck", label: "Мини-проверка", title: content.microcheck.q, answer: content.microcheck.a,
  });

  if (content.quiz?.length) {
    steps.push({
      type: "quiz", label: lessonId === 8 ? "Финальный экзамен" : "Проверка",
      title: lessonId === 8 ? "Итоговая проверка модуля" : "Проверьте понимание урока",
      questions: content.quiz.map((q) => ({
        q: q.q, options: q.options.map((o) => o.t),
        answer: Math.max(0, q.options.findIndex((o) => o.correct)), explain: q.explain,
      })),
    });
  }

  steps.push({ type: "reflection", label: "Рефлексия", title: "Свяжите урок со своей работой", prompt: content.reflection });
  steps.push({ type: "summary", label: lessonId === 8 ? "Модуль завершён" : "Финиш", title: lessonId === 8 ? "Вы собрали маркетинг в единую систему" : "Главные выводы", bullets: content.summary });

  return { id: lessonId, title: meta.title, eyebrow: `Модуль 1 · Урок ${lessonId}`, duration: meta.duration.replace("≈", "Около"), outcomes: content.results, steps };
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

  if (step.type === "terms") return <Card tone="indigo"><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2>
    <div style={{ display: "grid", gap: 10, marginTop: 16 }}>{step.items.map((item) => <div key={item.term} style={{ background: C.surface, borderRadius: 12, padding: 15 }}><div style={{ fontWeight: 800, color: C.indigo }}>{item.term}</div><p style={{ ...p, fontSize: 13, marginTop: 5 }}>{item.def}</p></div>)}</div>
  </Card>;

  if (step.type === "comparison") return <Card><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2>
    <div style={{ overflowX: "auto", marginTop: 16 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}><thead><tr>{step.header.map((h) => <th key={h} style={{ textAlign: "left", padding: 11, borderBottom: `2px solid ${C.border}`, color: C.ink }}>{h}</th>)}</tr></thead><tbody>{step.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding: 11, borderBottom: `1px solid ${C.border}`, color: j === 0 ? C.ink : C.muted, fontWeight: j === 0 ? 750 : 400 }}>{cell}</td>)}</tr>)}</tbody></table></div>
  </Card>;

  if (step.type === "examples") return <Card tone="teal"><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2>
    <div style={{ display: "grid", gap: 12, marginTop: 16 }}>{step.items.map((item, i) => <div key={i} style={{ background: C.surface, borderRadius: 12, padding: 15, display: "grid", gridTemplateColumns: "28px 1fr", gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 99, background: C.tealSoft, color: C.teal, display: "grid", placeItems: "center", fontWeight: 900 }}>{i + 1}</div><p style={{ ...p, margin: 0, fontSize: 13 }}>{item}</p></div>)}</div>
  </Card>;

  if (step.type === "practice") {
    const state = answers[key] || { task: 0, answer: "", revealed: false };
    const task = step.tasks[state.task] || step.tasks[0];
    return <Card tone="gold"><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2>
      <div style={{ display: "flex", gap: 7, margin: "12px 0" }}>{step.tasks.map((_, i) => <button key={i} onClick={() => setAnswers((a) => ({ ...a, [key]: { ...state, task: i, answer: "", revealed: false } }))} style={{ border: 0, borderRadius: 99, padding: "7px 11px", background: state.task === i ? C.ink : C.surface, color: state.task === i ? C.surface : C.ink, cursor: "pointer", fontWeight: 750 }}>Задание {i + 1}</button>)}</div>
      <p style={{ ...p, color: C.ink, fontWeight: 650 }}>{task}</p>
      <textarea value={state.answer} onChange={(e) => setAnswers((a) => ({ ...a, [key]: { ...state, answer: e.target.value } }))} placeholder="Запишите решение в 3–7 предложениях" style={{ width: "100%", minHeight: 135, marginTop: 10, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14, boxSizing: "border-box", resize: "vertical", font: "inherit", lineHeight: 1.5 }} />
      <button onClick={() => setAnswers((a) => ({ ...a, [key]: { ...state, revealed: !state.revealed } }))} style={{ marginTop: 10, border: `1px solid ${C.border}`, background: C.surface, borderRadius: 10, padding: "9px 12px", cursor: "pointer", fontWeight: 750 }}>{state.revealed ? "Скрыть ориентир" : "Показать ориентир для самопроверки"}</button>
      {state.revealed && <div style={{ marginTop: 10, background: C.surface, borderRadius: 12, padding: 14 }}><div style={{ fontWeight: 800, color: C.gold }}>Ориентир</div><p style={{ ...p, marginTop: 5, fontSize: 13 }}>{step.solution}</p></div>}
    </Card>;
  }

  if (step.type === "mistakes") return <Card tone="berry"><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2><div style={{ display: "grid", gap: 10, marginTop: 15 }}>{step.items.map((item) => <div key={item} style={{ display: "flex", gap: 10, background: C.surface, borderRadius: 12, padding: 14 }}><X size={18} color={C.berry} /><span style={{ fontSize: 13, lineHeight: 1.5 }}>{item}</span></div>)}</div></Card>;

  if (step.type === "microcheck") {
    const shown = Boolean(answers[key]);
    return <Card><Label>{step.label}</Label><h2 style={h2}>{step.title}</h2><button onClick={() => setAnswers((a) => ({ ...a, [key]: !shown }))} style={{ marginTop: 8, border: 0, borderRadius: 10, padding: "10px 14px", background: C.ink, color: C.surface, cursor: "pointer", fontWeight: 800 }}>{shown ? "Скрыть ответ" : "Проверить себя"}</button>{shown && <p style={{ ...p, marginTop: 14 }}>{step.answer}</p>}</Card>;
  }

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

export default function StepLesson({ lessonId = 1, onBack, onComplete, nextLabel, onPracticeSave }) {
  const activeLesson = useMemo(() => lessonId === 1 ? LESSON : lessonId === 2 ? LESSON_2 : buildLessonFromCatalog(lessonId), [lessonId]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const step = activeLesson.steps[index];
  const stepKey = `step_${index}`;
  const progress = Math.round(((index + 1) / activeLesson.steps.length) * 100);
  const enriched = useMemo(() => ({ ...answers, stepKey }), [answers, stepKey]);

  function finish() {
    const quizStep = activeLesson.steps.find((s) => s.type === "quiz");
    const quizIndex = activeLesson.steps.findIndex((s) => s.type === "quiz");
    const quizAnswers = answers[`step_${quizIndex}`] || {};
    const score = quizStep.questions.reduce((sum, q, i) => sum + (quizAnswers[i] === q.answer ? 1 : 0), 0);
    const reflectionIndex = activeLesson.steps.findIndex((s) => s.type === "reflection");
    const reflection = answers[`step_${reflectionIndex}`] || "";
    onPracticeSave?.(`l${activeLesson.id}`, "reflection", { answer: reflection, feedback: "" });
    onComplete(activeLesson.id, score, quizStep.questions.length, reflection);
  }

  return <Shell>
    <button onClick={onBack} style={{ border: "none", background: "transparent", color: C.muted, display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: 0, marginBottom: 22, fontWeight: 700 }}><ArrowLeft size={16} /> К обзору модуля</button>
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", marginBottom: 10 }}>
        <div><div style={{ fontSize: 12, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: .8 }}>{activeLesson.eyebrow}</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, lineHeight: 1.08, margin: "5px 0 6px", color: C.ink }}>{activeLesson.title}</h1>
          <div style={{ fontSize: 13, color: C.faint }}>{activeLesson.duration}</div></div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{progress}%</div>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: C.border, overflow: "hidden" }}><div style={{ width: `${progress}%`, height: "100%", background: C.gold, transition: "width .25s ease" }} /></div>
    </div>

    {index === 0 && <Card><Label>После урока вы сможете</Label><ul style={{ margin: "10px 0 0", paddingLeft: 20, lineHeight: 1.75, color: C.ink }}>{activeLesson.outcomes.map((x) => <li key={x}>{x}</li>)}</ul></Card>}
    <div style={{ marginTop: 16 }}><StepBody step={step} answers={enriched} setAnswers={setAnswers} /></div>

    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 18 }}>
      <Button secondary disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}><ArrowLeft size={16} /> Назад</Button>
      {index < activeLesson.steps.length - 1 ? <Button onClick={() => setIndex((i) => i + 1)}>Продолжить <ArrowRight size={16} /></Button>
        : <div style={{ display: "flex", gap: 8 }}><Button secondary onClick={() => { setIndex(0); setAnswers({}); }}><RotateCcw size={16} /> Пройти заново</Button><Button onClick={finish}>{nextLabel} <ArrowRight size={16} /></Button></div>}
    </div>
  </Shell>;
}
