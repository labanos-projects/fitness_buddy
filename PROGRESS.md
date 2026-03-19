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

## 🔜 Good next tasks (small)

- **Clean up built-in exercise illustrations** — several built-in exercises have placeholder/missing DB illustrations; could batch-regenerate or curate them
- **Add `fitness-buddy.riv`** — if/when a Rive animation file is ready, drop it in `public/` and remove the `riveReady = false` override in `ExerciseAnimation.jsx`
- **Exercise detail view** — tapping a Library card could open a full-screen detail with instructions, muscles, sets/reps suggestions
- **Custom exercise editing** — allow renaming/editing description of AI-generated exercises from the Library
- **Workout history** — log completed workouts with date/duration, show streak/stats on home screen
- **Rest timer improvements** — optional audio cue or haptic at rest end

---

## 🚧 Big refactor: User auth + cloud sync

### Problem
Routines and custom exercises are stored in `localStorage` — device-specific only. Saving on desktop means nothing appears on iPhone. Only exercise *illustrations* currently live in the DB.

### Goal
- Workouts/routines saved in DB, per user, accessible on any device
- Exercises become a shared/common library (global pool), not per-device
- AI generation and edits require being logged in

### Decisions needed before starting

**1. Auth model** 
Options (simplest → most complex):
- **Magic link** — enter email → get a one-click login link → no passwords. Best UX for a mobile PWA.
- **Email + password** — standard, but adds password reset flow complexity.
- **Passphrase / sync code** — generate a short code (like `tiger-lamp-84`), enter it on another device. No email required, but less secure and no recovery.
- **Recommendation**: magic link. Fits the "no fluff" ethos, works great on iPhone, no password manager needed.

**2. Exercise library model** 
Options:
- **Fully shared** — AI-invented exercises from any user join the global library. Could get messy fast.
- **Curated shared** — built-ins are global; user-generated exercises are private until an admin promotes them.
- **Per-user private** — each user's custom exercises are only visible to them.
- **Recommendation**: per-user private for now (simplest). Promotion to shared library can come later.

**3. Guest / offline mode** 
Options:
- **Hard require login** — simplest to build, but blocks casual first-time use.
- **Guest mode (read-only)** — can browse exercises and run built-in workouts without login; saving requires login.
- **Guest mode (full local fallback)** — works offline/localStorage as today; login triggers a one-time migration to DB.
- **Recommendation**: guest read-only. First visit shows the library and lets you try a workout. "Save" or "Generate" prompts login.

**4. Migration** 
On first login, existing `localStorage` routines (`fb_saved_routines`) and custom exercises (`fb_custom_exercises`) should be offered for import to the account.

### Proposed data model

```sql
-- Users
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Magic link tokens (short-lived)
CREATE TABLE auth_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used       TINYINT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Session tokens (long-lived, stored in localStorage)
CREATE TABLE sessions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(64) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User routines (replaces fb_saved_routines in localStorage)
CREATE TABLE routines (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  routine_id VARCHAR(36) NOT NULL,   -- client-generated UUID for offline compat
  name       VARCHAR(255) NOT NULL,
  data       JSON NOT NULL,          -- full routine object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (user_id, routine_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User custom exercises (replaces fb_custom_exercises in localStorage)
CREATE TABLE user_exercises (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  exercise_id VARCHAR(80) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  data        JSON NOT NULL,         -- full exercise object
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (user_id, exercise_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- exercise_illustrations already exists (shared, no user_id)
```

### New PHP endpoints needed

| Endpoint | Method | Purpose |
|---|---|---|
| `auth-request.php` | POST | Send magic link email for given address |
| `auth-verify.php` | GET | Verify magic link token → return session token |
| `auth-session.php` | GET | Validate session token, return user info |
| `routines-sync.php` | GET/POST/DELETE | CRUD for user routines |
| `exercises-sync.php` | GET/POST/DELETE | CRUD for user custom exercises |

### Frontend changes needed

- `src/hooks/useAuth.js` — new hook: session token in localStorage, user state, login/logout
- `src/hooks/useSavedRoutines.js` — swap localStorage for API calls when logged in
- `src/hooks/useCustomExercises.js` — same swap
- `src/components/AuthGate.jsx` — new: email input → "check your email" screen → sets session
- `src/App.jsx` — wrap generate/save actions with auth check; show login prompt if not authed
- `src/components/AiComposer.jsx` — require auth before calling compose endpoint
- `src/components/WorkoutEditor.jsx` — require auth before saving
- Migration flow: on login, detect existing localStorage data, offer one-tap import

### Rough implementation order
1. DB schema (run migration on server)
2. `auth-request.php` + `auth-verify.php` + `auth-session.php`
3. `useAuth` hook + `AuthGate` component
4. `routines-sync.php` + update `useSavedRoutines`
5. `exercises-sync.php` + update `useCustomExercises`
6. Lock down `compose-workout.php` and `auto-illustrate.php` to require session token
7. Migration flow on first login
8. Guest read-only mode polish

---

## 🏗 Architecture notes

- **Frontend**: React 19 + Vite PWA → GitHub Pages (`fitnessbuddy.labanos.dk`)
- **Backend**: PHP on `labanos.dk`, deployed via SFTP GitHub Actions
- **AI**: Gemini API — text (`gemini-2.0-flash`) for workouts, image (`gemini-2.5-flash-image`) for illustrations
- **Storage**: `localStorage` for routines + custom exercises client-side (to be migrated to DB); MySQL DB for illustration images
- **API base**: `VITE_API_BASE || 'https://labanos.dk'` pattern throughout
- **Routing**: screen-based state in `App.jsx` — `home | library | compose | edit | workout | complete`
- **Auth**: currently — admin token in `localStorage` (`fb_admin_token`) gates illustration editing only
