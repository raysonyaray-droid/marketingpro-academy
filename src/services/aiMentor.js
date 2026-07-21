export async function callAIMentor({ task, answer, context }) {
  const endpoint = import.meta.env.VITE_AI_MENTOR_URL;

  if (!endpoint) {
    return {
      ok: false,
      text: "Ответ сохранён. ИИ-наставник пока не подключён: добавьте адрес серверного API в переменную VITE_AI_MENTOR_URL.",
    };
  }

  const system = `Ты — академический наставник курса BIOCARD Marketing Academy. Оцени практический ответ студента по рубрике: понятность, соответствие вопросу, наличие аргумента, использование понятий урока, конкретность, связь с рабочей ситуацией. Не хвали автоматически. Структура ответа (коротко, по-русски, без markdown-заголовков): 1) Результат — что выполнено. 2) Сильная сторона — один конкретный элемент. 3) Критическая ошибка — если есть, где нарушена логика. 4) Риск — к чему это приведёт в реальной работе. 5) Что исправить — конкретный следующий шаг. Будь краток (6–9 предложений суммарно), профессионален, без общих фраз вроде «отличная работа».`;
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
    const text = typeof data.text === "string" ? data.text.trim() : "";

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
