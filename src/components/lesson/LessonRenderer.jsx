/**
 * Stable lesson rendering boundary.
 *
 * Iteration 1 keeps the current lesson experience intact while moving lesson
 * selection behind a dedicated component. Iteration 2 can add section-based
 * renderers here without changing routing or application state.
 */
export default function LessonRenderer({ lesson, lessonId, renderLegacy }) {
  if (typeof renderLegacy !== "function") {
    throw new Error(`Lesson ${lessonId}: renderLegacy must be a function`);
  }

  // Existing lessons use the legacy schema. New section-based lessons will be
  // detected and rendered by a section registry in the next iteration.
  if (!lesson || !Array.isArray(lesson.sections)) {
    return renderLegacy();
  }

  return renderLegacy();
}
