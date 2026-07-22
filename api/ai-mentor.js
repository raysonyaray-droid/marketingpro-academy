const GEMINI_MODEL = "gemini-2.5-flash";

function sendJson(response, statusCode, data) {
  return response.status(statusCode).json(data);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildPrompt({ task, answer, context, system }) {
  return `
Ты — ИИ-наставник образовательной платформы.

Твоя задача — проверить ответ сотрудника по существу и дать полезную обратную связь.

Правила:
1. Оценивай только то, что есть в ответе.
2. Не придумывай отсутствующие факты.
3. Не завышай оценку из вежливости.
4. Учитывай формулировку задания и учебный контекст.
5. Пиши спокойно, конкретно и без лишней воды.
6. Не используй персональные данные.
7. Отвечай только на русском языке.
8. Верни только JSON без Markdown и без пояснений вокруг JSON.

Формат результата:
{
  "score": число от 0 до 100,
  "status": "passed" | "revision" | "failed",
  "verdict": "короткий вывод",
  "feedback": "развернутая обратная связь",
  "mistakes": ["ошибка или пробел"],
  "strengths": ["сильная сторона"],
  "nextStep": "что конкретно улучшить"
}

Критерии:
- passed: 80–100
- revision: 50–79
- failed: 0–49

Дополнительная инструкция:
${system || "Нет"}

Задание:
${task || "Не указано"}

Учебный контекст:
${context || "Не указан"}

Ответ сотрудника:
${answer}
`;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, {
      error: "Method not allowed",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return sendJson(response, 500, {
      error: "GEMINI_API_KEY is not configured",
    });
  }

  const body = request.body || {};

  const task = normalizeText(body.task);
  const answer = normalizeText(body.answer);
  const context = normalizeText(body.context);
  const system = normalizeText(body.system);

  if (!answer) {
    return sendJson(response, 400, {
      error: "Ответ пользователя пуст",
    });
  }

  const prompt = buildPrompt({
    task,
    answer,
    context,
    system,
  });

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                score: {
                  type: "INTEGER",
                  minimum: 0,
                  maximum: 100,
                },
                status: {
                  type: "STRING",
                  enum: ["passed", "revision", "failed"],
                },
                verdict: {
                  type: "STRING",
                },
                feedback: {
                  type: "STRING",
                },
                mistakes: {
                  type: "ARRAY",
                  items: {
                    type: "STRING",
                  },
                },
                strengths: {
                  type: "ARRAY",
                  items: {
                    type: "STRING",
                  },
                },
                nextStep: {
                  type: "STRING",
                },
              },
              required: [
                "score",
                "status",
                "verdict",
                "feedback",
                "mistakes",
                "strengths",
                "nextStep",
              ],
            },
          },
        }),
      }
    );

    const rawData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", rawData);

      return sendJson(response, geminiResponse.status, {
        error:
          rawData?.error?.message ||
          "Gemini API вернул ошибку",
      });
    }

    const resultText =
      rawData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return sendJson(response, 502, {
        error: "Gemini не вернул результат проверки",
      });
    }

    let result;

    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Gemini JSON parse error:", {
        parseError,
        resultText,
      });

      return sendJson(response, 502, {
        error: "Gemini вернул ответ в неверном формате",
      });
    }

    return sendJson(response, 200, result);
  } catch (error) {
    console.error("AI mentor error:", error);

    return sendJson(response, 500, {
      error: "Не удалось проверить ответ",
    });
  }
}