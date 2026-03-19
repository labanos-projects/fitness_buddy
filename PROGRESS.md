# Fitness Buddy — Session Progress

> Last updated: 2026-03-19

---

## ✅ Completed features

### 1. Evolving Exercise Library (AI-invented exercises)
- Gemini prompt updated in `php/compose-workout.php` to allow inventing NEW exercises (not just picking from built-ins)
- New exercises returned in a `newExercises` array alongside the normal `exercises` list
- New exercise IDs are validated/sanitised (kebab-case, no collision with built-ins)
- `src/hooks/useCustomExercises.js` — new hook, mirrors `useSavedRoutines`, stores in `localStorage` key `fb_custom_exercises`
- `src/App.jsx` — wires up `useCustomExercises`, passes `customExercises` + `onAddExercises` down to Library, AiComposer, WorkoutEditor, Workout
- `src/components/AiComposer.jsx` — calls `onAddExercises(data.newExercises)` after generation; fires `autoIllustrate()` for each new exercise
- `src/components/WorkoutEditor.jsx` — merges built-ins + custom, shows "✨ Generated" section in add panel
- `src/components/Workout.jsx` — merges built-ins + custom for the active workout exercise map
- `src/components/Library.jsx` — shows "✨ Generated Exercises" section at bottom; supports editing/regenerating illustrations for generated exercises too
- `src/styles/App.css` — added `.library-card-generated`, `.library-tag-new`, `.library-muscles`, `.library-section-header`, `.ai-chip-new`, `.editor-add-section-label`

### 2. Auto-illustrations for AI-invented exercises
- `php/auto-illustrate.php` — new public endpoint, idempotent (checks DB before generating)
  - Accepts: `exercise_id`, `name`, `description`, `category`, `muscles`
  - Calls `gemini-2.5-flash-image`, stores result in `exercise_illustrations` DB table
  - Protected against abuse: returns `{"skipped": true}` if illustration already exists
  - `set_time_limit(150)`, `CURLOPT_TIMEOUT => 120`
- `.github/workflows/deploy-php.yml` — `auto-illustrate.php` added to SFTP deploy list
- Fire-and-forget pattern in `AiComposer.jsx` — illustrations requested in background, UI never blocks

### 3. Timeout fix for workout generation
- `php/compose-workout.php`
  - `set_time_limit(90)` at top
  - `CURLOPT_TIMEOUT => 60` (was 30)
  - `CURLOPT_CONNECTTIMEOUT => 10` added to both curl calls

### 4. PWA icon & favicon fixes
- Generated `public/favicon.ico`, `public/icon-192.png`, `public/icon-512.png`
  - Lightning bolt design, navy `#1a1a2e` bg, red `#e94560` accent
- `index.html` — added `<link rel="icon" href="/favicon.ico" sizes="any" />`

### 5. Rive 404 console noise fix
- `src/components/ExerciseAnimation.jsx` — removed the `useEffect` + HEAD fetch for `fitness-buddy.riv`
- `riveReady` is now a plain `false` constant (no network call, no 404 noise)
- Rive path remains in code, ready to activate when the `.riv` file is actually added

---

## 🗂 Key files to know

| File | Purpose |
|---|---|
| `php/compose-workout.php` | Gemini workout generation (invents new exercises) |
| `php/auto-illustrate.php` | Background illustration generation for new exercises |
| `src/hooks/useCustomExercises.js` | localStorage hook for AI-generated exercises |
| `src/hooks/useSavedRoutines.js` | localStorage hook for saved routines |
| `src/hooks/useIllustrations.js` | Fetches illustration frames from DB |
| `src/components/AiComposer.jsx` | AI workout generation UI |
| `src/components/Library.jsx` | Exercise library (built-in + generated) |
| `src/components/WorkoutEditor.jsx` | Edit/build routines |
| `src/components/Workout.jsx` | Active workout screen |
| `src/components/ExerciseAnimation.jsx` | Illustration/animation renderer |
| `src/App.jsx` | Root — screen routing + shared state |

---

## 🔜 Good next tasks

- **Clean up built-in exercise illustrations** — several built-in exercises have placeholder/missing DB illustrations; could batch-regenerate or curate them
- **Add `fitness-buddy.riv`** — if/when a Rive animation file is ready, drop it in `public/` and remove the `riveReady = false` override in `ExerciseAnimation.jsx`
- **Exercise detail view** — tapping a Library card could open a full-screen detail with instructions, muscles, sets/reps suggestions
- **Custom exercise editing** — allow renaming/editing description of AI-generated exercises from the Library
- **Workout history** — log completed workouts with date/duration, show streak/stats on home screen
- **Rest timer improvements** — optional audio cue or haptic at rest end

---

## 🏗 Architecture notes

- **Frontend**: React 19 + Vite PWA → GitHub Pages (`fitnessbuddy.labanos.dk`)
- **Backend**: PHP on `labanos.dk`, deployed via SFTP GitHub Actions
- **AI**: Gemini API — text (`gemini-2.0-flash`) for workouts, image (`gemini-2.5-flash-image`) for illustrations
- **Storage**: `localStorage` for routines + custom exercises client-side; MySQL DB for illustration images
- **API base**: `VITE_API_BASE || 'https://labanos.dk'` pattern throughout
- **Routing**: screen-based state in `App.jsx` — `home | library | compose | edit | workout | complete`
- **Auth**: admin token in `localStorage` (`fb_admin_token`) gates illustration editing in Library
