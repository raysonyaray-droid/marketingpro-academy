# Iteration 2

## Что изменено

- Общие дизайн-токены и стили кнопок подключены из `src/styles/theme.js`.
- Базовые UI-компоненты вынесены в `src/components/ui/Primitives.jsx`.
- Боковая навигация вынесена в `src/components/layout/AppSidebar.jsx`.
- Работа с `localStorage` вынесена в `src/services/academyStorage.js`.
- Карта курса теперь использует единый каталог из `src/data/courseCatalog.js` без дублирования данных.
- Убраны вызовы `Math.random()` во время рендера; порядок вариантов стал воспроизводимым.
- Исправлена ошибка карты курса с неопределённой переменной `isFirst`.
- Добавлена базовая адаптация боковой панели для узких экранов.
- Проверены ESLint и production build.

## Проверка

- `npm run lint` — успешно.
- `npm run build` — успешно.
