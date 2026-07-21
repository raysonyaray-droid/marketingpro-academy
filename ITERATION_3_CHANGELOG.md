# Итерация 3

## Что изменено

- Корневое состояние академии и все основные действия вынесены в `src/hooks/useAcademyState.js`.
- Загрузка и сохранение состояния теперь централизованы в одном hook.
- Онбординг вынесен из монолитного файла в `src/components/onboarding/Onboarding.jsx`.
- Данные онбординга и профиль BIOCARD вынесены в `src/data/academyConfig.js`.
- Основной layout приложения вынесен в `src/components/layout/AppLayout.jsx`.
- Запросы к ИИ-наставнику вынесены в `src/services/aiMentor.js`.
- Детерминированное перемешивание вынесено в `src/utils/shuffle.js`.
- `MarketingProAcademy.jsx` сокращён и теперь в основном отвечает за экраны и предметные компоненты.
- Убрана повторная логика переходов к урокам: используется единый метод `openLesson`.
- Исправлено формирование подписи следующего урока: оно теперь опирается на фактически открытый урок.
- ESLint и production build проходят без ошибок.

## Проверка

```bash
npm install
npm run lint
npm run build
npm run dev
```
