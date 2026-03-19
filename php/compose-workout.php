<?php
// ─── AI Workout Composer ─────────────────────────────────────────────────────
// POST { prompt } → returns a structured workout JSON (may include newExercises)
set_time_limit(90); // ensure PHP doesn't kill us before curl finishes
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

// ─── Gemini config ─────────────────────────────────────────────────────────────
$configFile = __DIR__ . '/config.local.php';
if (file_exists($configFile)) { require_once $configFile; }
if (!defined('GEMINI_API_KEY')) {
    $envKey = getenv('GEMINI_API_KEY');
    if ($envKey) define('GEMINI_API_KEY', $envKey);
    else { http_response_code(500); echo json_encode(['error' => 'Gemini API key not configured']); exit; }
}

// ─── Parse request ───────────────────────────────────────────────────────────
$data = json_decode(file_get_contents('php://input'), true);
$userPrompt = trim($data['prompt'] ?? '');

if (empty($userPrompt)) {
    http_response_code(400); echo json_encode(['error' => 'prompt is required']); exit;
}

// ─── Discover best available text model ─────────────────────────────────────
function pick_text_model($apiKey) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}&pageSize=100";
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);

    $candidates = [];
    foreach (json_decode($resp, true)['models'] ?? [] as $m) {
        $id = preg_replace('/^models\//', '', $m['name'] ?? '');
        if (!in_array('generateContent', $m['supportedGenerationMethods'] ?? [])) continue;
        // Skip specialised / non-text models
        foreach (['image','thinking','tts','computer','research','robotics','nano','banana'] as $skip) {
            if (stripos($id, $skip) !== false) continue 2;
        }
        $candidates[] = $id;
    }
    if (empty($candidates)) return [null, []];

    usort($candidates, function($a, $b) {
        $score = function($id) {
            preg_match('/gemini-(\d+)/', $id, $m);
            $major   = isset($m[1]) ? (int)$m[1] : 0;
            $flash   = stripos($id, 'flash')   !== false ?  2 : 0;
            $preview = (stripos($id, 'preview') !== false ||
                        stripos($id, 'exp')     !== false) ? -20 : 0;
            $lite    = stripos($id, 'lite')    !== false ? -1 : 0;
            return $major * 10 + $flash + $preview + $lite;
        };
        return $score($b) - $score($a);
    });

    return [$candidates[0], $candidates];
}

[$model, $allCandidates] = pick_text_model(GEMINI_API_KEY);
if (!$model) {
    http_response_code(500);
    echo json_encode(['error' => 'No suitable text generation model found on this API key']);
    exit;
}

// ─── Built-in exercise library ───────────────────────────────────────────────
$builtInExercises = [
    ['id' => 'jumping-jacks',       'name' => 'Jumping Jacks',          'category' => 'cardio',   'muscles' => 'full-body'],
    ['id' => 'wall-sit',            'name' => 'Wall Sit',               'category' => 'strength', 'muscles' => 'quads, glutes'],
    ['id' => 'push-ups',            'name' => 'Push-Ups',               'category' => 'strength', 'muscles' => 'chest, triceps, shoulders'],
    ['id' => 'crunches',            'name' => 'Abdominal Crunches',     'category' => 'strength', 'muscles' => 'abs'],
    ['id' => 'step-ups',            'name' => 'Step-Ups',               'category' => 'strength', 'muscles' => 'quads, glutes'],
    ['id' => 'squats',              'name' => 'Squats',                 'category' => 'strength', 'muscles' => 'quads, glutes, hamstrings'],
    ['id' => 'tricep-dips',         'name' => 'Tricep Dips',            'category' => 'strength', 'muscles' => 'triceps, shoulders'],
    ['id' => 'plank',               'name' => 'Plank',                  'category' => 'strength', 'muscles' => 'core, shoulders'],
    ['id' => 'high-knees',          'name' => 'High Knees',             'category' => 'cardio',   'muscles' => 'full-body'],
    ['id' => 'lunges',              'name' => 'Lunges',                 'category' => 'strength', 'muscles' => 'quads, glutes, hamstrings'],
    ['id' => 'push-up-rotation',    'name' => 'Push-Up with Rotation',  'category' => 'strength', 'muscles' => 'chest, core, shoulders'],
    ['id' => 'side-plank',          'name' => 'Side Plank',             'category' => 'strength', 'muscles' => 'obliques, core'],
    ['id' => 'cat-cow',             'name' => 'Cat-Cow Flow',           'category' => 'yoga',     'muscles' => 'spine, core'],
    ['id' => 'downward-dog',        'name' => 'Downward Dog',           'category' => 'yoga',     'muscles' => 'hamstrings, shoulders, back'],
    ['id' => 'warrior-ii',          'name' => 'Warrior II',             'category' => 'yoga',     'muscles' => 'legs, hips, shoulders'],
    ['id' => 'childs-pose',         'name' => "Child's Pose",          'category' => 'yoga',     'muscles' => 'back, hips'],
    ['id' => 'seated-forward-fold', 'name' => 'Seated Forward Fold',    'category' => 'yoga',     'muscles' => 'hamstrings, back'],
];

$builtInIds = array_column($builtInExercises, 'id');

$exerciseLines = implode("\n", array_map(
    fn($e) => "- {$e['id']} ({$e['category']}): {$e['name']}, targets {$e['muscles']}",
    $builtInExercises
));

$fullPrompt = <<<PROMPT
You are a fitness program designer. Create a workout routine based on this request: "{$userPrompt}"

Known exercises (prefer these, use their exact IDs):
{$exerciseLines}

Rules:
- Prefer exercises from the known list above
- You MAY invent NEW exercises if the request calls for movements not covered above
- For each NEW exercise, add an entry to "newExercises" with:
    - id: kebab-case, unique, not matching any known ID above
    - name: display name (max 50 chars)
    - description: 1-2 sentences on how to perform it
    - category: one of "cardio", "strength", or "yoga"
    - muscles: JSON array of target muscle group strings
- Include 4-16 exercises total (repetition is fine)
- workDuration and restDuration are in seconds
- Yoga: work 30-60s, rest 10-15s
- HIIT: work 20-40s, rest 5-15s
- Strength: work 30-45s, rest 15-20s
- Match the requested duration as closely as possible
- If all exercises are from the known list, set "newExercises" to []

Respond with ONLY valid JSON and nothing else:
{"name":"...","description":"...","category":"hiit|yoga|strength|cardio|core","workDuration":30,"restDuration":10,"exercises":["id1","id2"],"newExercises":[{"id":"new-ex","name":"New Exercise","description":"How to do it.","category":"strength","muscles":["core","abs"]}]}
PROMPT;

// ─── Call Gemini API ─────────────────────────────────────────────────────────
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . GEMINI_API_KEY;

$payload = [
    'contents' => [['parts' => [['text' => $fullPrompt]]]],
    'generationConfig' => [
        'temperature'     => 0.7,
        'maxOutputTokens' => 8192,
        // Disable thinking tokens so the full budget goes to JSON output.
        // Ignored by non-thinking models, safe to send unconditionally.
        'thinkingConfig'  => ['thinkingBudget' => 0],
    ],
];

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,  // fail fast if server unreachable
    CURLOPT_TIMEOUT        => 60,  // give Gemini up to 60s to respond
]);
$response = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr   = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    http_response_code(502); echo json_encode(['error' => 'cURL error: ' . $curlErr]); exit;
}
if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'Gemini HTTP ' . $httpCode, 'model' => $model, 'detail' => json_decode($response, true)]);
    exit;
}

// ─── Extract JSON ──────────────────────────────────────────────────────────────
$result    = json_decode($response, true);
$candidate = $result['candidates'][0] ?? null;
$text      = $candidate['content']['parts'][0]['text'] ?? '';

if (empty($text)) {
    http_response_code(500);
    echo json_encode([
        'error'         => 'Empty text from Gemini',
        'model'         => $model,
        'finish_reason' => $candidate['finishReason'] ?? null,
        'gemini_raw'    => $result,
    ]);
    exit;
}

$start = strpos($text, '{');
$end   = strrpos($text, '}');

if ($start === false || $end === false || $end <= $start) {
    http_response_code(500);
    echo json_encode(['error' => 'No JSON object in AI response', 'model' => $model, 'raw' => $text]);
    exit;
}

$json    = substr($text, $start, $end - $start + 1);
$workout = json_decode($json, true);

if (!$workout || !isset($workout['exercises']) || !is_array($workout['exercises'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not parse workout JSON', 'model' => $model, 'raw' => $json]);
    exit;
}

// ─── Validate & sanitise new exercises ───────────────────────────────────────
$sanitisedNew = [];
$newExIds     = [];

foreach ($workout['newExercises'] ?? [] as $ne) {
    // Sanitise ID: lowercase kebab-case only
    $neId = preg_replace('/[^a-z0-9\-]/', '-', strtolower(trim($ne['id'] ?? '')));
    $neId = preg_replace('/-+/', '-', trim($neId, '-'));

    if (!$neId) continue;
    if (in_array($neId, $builtInIds, true)) continue;   // don't shadow built-ins
    if (in_array($neId, $newExIds,   true)) continue;   // no duplicates

    $validCategories = ['cardio', 'strength', 'yoga'];
    $cat = in_array($ne['category'] ?? '', $validCategories, true) ? $ne['category'] : 'strength';

    $muscles = [];
    foreach ((array)($ne['muscles'] ?? []) as $m) {
        $muscles[] = substr(strip_tags((string)$m), 0, 40);
    }

    $sanitisedNew[] = [
        'id'          => $neId,
        'name'        => substr(strip_tags(trim($ne['name']        ?? $neId)), 0, 80),
        'description' => substr(strip_tags(trim($ne['description'] ?? '')),    0, 400),
        'category'    => $cat,
        'muscles'     => array_slice($muscles, 0, 8),
    ];
    $newExIds[] = $neId;
}

// ─── Validate exercise list (built-ins + newly invented) ────────────────────
$allValidIds = array_merge($builtInIds, $newExIds);
$workout['exercises'] = array_values(
    array_filter($workout['exercises'], fn($id) => in_array($id, $allValidIds, true))
);

if (empty($workout['exercises'])) {
    http_response_code(500);
    echo json_encode(['error' => 'No valid exercise IDs in AI response', 'model' => $model, 'raw' => $json]);
    exit;
}

$workout['workDuration'] = max(10, min(120, intval($workout['workDuration'] ?? 30)));
$workout['restDuration'] = max(5,  min(60,  intval($workout['restDuration']  ?? 10)));
$workout['newExercises'] = $sanitisedNew;
$workout['_model']       = $model;

echo json_encode($workout);
