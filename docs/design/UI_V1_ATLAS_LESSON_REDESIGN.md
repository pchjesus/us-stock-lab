# UI v1 Stage 5 — Atlas-based learning workspace and visible settings

Status: design branch only, opt-in `?ui=v1`. No engine/account/auth/Supabase/data migrations or change to default UI.

## Problem and chosen solution

**Observed user issue:** the lesson route showed all ten lessons as horizontal full-width accordion rows; expanding one placed its entire lesson and numerous sub-sections into a long, uninterrupted vertical page. The new UI must let a beginner find a lesson, read one segment, practice, and continue without losing their place.

**Chosen information architecture:** `course overview (#learn)` → `lesson navigator (#learn/lessons)` → `selected lesson` → four focused steps `개념 / 사례 / 실습 / 퀴즈`, with previous/next lesson navigation. The existing 10-lesson source, answer state, progress storage, chart/trade links and source list remain unchanged. User answers and completed lesson flags remain user-selected, never inferred from tab changes or scroll progress.

### Atlas research that informed *specific* decisions

Design source (read directly from `pchjesus/design-kkakgi` GitHub repo):
- `references/ATLAS_HOME.md`: task → information structure → pattern → visual form → verification, separate design hypotheses and observed behaviors.
- `references/UI_LAYOUT_FIRST_USE_ATLAS_v0.1_20261111.md`, SRC-19: **Sidebar + split-screen** for navigable content plus a primary workspace; on mobile, stacking the controls before the active content is preferable to a shrinking two-column reader.
- `references/UI_LIST_PRESENTATION_ATLAS_v0.1_20261112.md`, SRC-24: **List** for chapter selection, not ten expandable **Accordion** pages. An accordion is suitable for short secondary information (here: source references), not a required long learning workflow. **Table** remains only for data relationships inside examples; **timeline** only for actual ordered examples.
- `references/MOTION_INDICATOR_ATLAS_v0.1_20261105.md`, SRC-08 Tab indicator and `references/UI_MOTION_BEHAVIOR_ADDENDUM_v0.1_20261108.md`, SRC-14 Tab switch: selected-state and content must move together; arrow/Home/End tab navigation and correct ARIA state are primary, motion secondary.

**Implementation:** `src/design/v1/LearningUnitV1.tsx` is a read-only presentation shell over the original `LearningUnit` model; it does not redefine lessons, question options or progress calculations. `src/Learning.tsx` renders one selected lesson on v1; the original ten-accordion UI remains for the legacy view pending explicit transition approval. `src/design/v1/sections.css` contains only scoped v1 CSS (no fonts, images or source atlas assets copied).

### Decisions applied vs deliberately excluded

| Apply | Why |
| --- | --- |
| Desktop left chapter list with a single, readable right-hand lesson | No repeated long expanding pages; constant location and clear next action |
| Mobile single chapter select, with original progress visible and lesson below | Ten item rows would be an unhelpful scroll before reading; consistent with compact view |
| 4 equal, keyboard-navigable sections `개념/사례/실습/퀴즈` | Learner chooses level of detail; no mandatory linear gate, no quiz lock |
| Visible text labels for selection, done flags, question feedback | State never relies solely on color |
| 160–180ms subtle reader fade and item positioning, reduced-motion disabled | Contextual content change rather than decorative looping; accessible fallback |
| Preserve `GuidedPractice`, source links, questions and manual completion | Core learning content, navigation, and storage remain authoritative |
| **Settings as a labeled desktop sidebar item** with its own `계정과 환경` group; mobile header shows `설정` | Eliminates discoverability failure of gear-only footer and ‘로그인’ gateway |
| Previous/next lesson links and deep links `#learn/lessons/<id>` | Return, browser navigation, and saved learning missions remain reachable |

Rejected: Masonry, Bento mosaic for ten sequential lessons, automatic card carousel, pageless infinite scroll, learning-complete flags inferred from views, 3D motion, oversized hero, design assets copying from the Atlas, adding new credentials or altering server/RPC.

## Browser QA acceptance criteria

1. Exactly **one** `.v1-course-active` and **zero** visible/DOM ten-card `.lesson-card` on v1 lessons route.
2. Ten chapters in desktop navigation, one chapter picker mobile (320/390/768px). A chapter switch updates the existing hash route and displays only that lesson.
3. All original concept, importance, application, misunderstanding, examples, numerical tables/timelines, practice mission, quiz questions, feedback and references remain readable under four steps.
4. Quiz answers and completion survive chapter switches, refresh and returns to `#learn` progress; original `#learn/lessons` retains old behavior without v1 flag.
5. Desktop Settings is a visible navigation row, mobile header is labeled Settings, collapsed desktop sidebar retains its icon.
6. Tab arrow/Home/End works; Enter/Space standard, focus-visible, reduced motion, responsive no horizontal overflow at widths 320,390,768,1024,1440.
7. Finance data, account data, auth, market data, backtest results and financial calculations stay untouched.

Original GitHub Actions branch workflow builds the app with production feature flags, renders desktop/mobile screenshot artifact, verifies v1 behaviors, entire UI suite, auth, Release and UX0. A **successful GitHub Pages deployment** of the separated preview is required before the URL is described as current. Actual physical-device and screen-reader user tests are **NOT RUN** unless separately confirmed.

### Sources (APA 7)

디자인 깎기. (2026, November 11). *UI 레이아웃·앱 첫 사용 경험 레퍼런스 아틀라스 v0.1* [Internal research draft]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_LAYOUT_FIRST_USE_ATLAS_v0.1_20261111.md

디자인 깎기. (2026, November 12). *SRC-24 — 목록 표현·비교·탐색 방식 9종 아틀라스 v0.1* [Internal research draft]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_LIST_PRESENTATION_ATLAS_v0.1_20261112.md

World Wide Web Consortium. (n.d.). *Tabs pattern*. WAI-ARIA Authoring Practices Guide. https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

World Wide Web Consortium. (n.d.). *Accordion pattern*. WAI-ARIA Authoring Practices Guide. https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
