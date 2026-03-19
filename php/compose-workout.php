<?php
// ─── AI Workout Composer ─────────────────────────────────────────────────────
// POST { prompt } → returns a structured workout JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

// ─── Gemini config (mirrors regenerate.php) ──────────────────────────────────
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
if (strlen($userPrompt) > 500) {
    http_response_code(400); echo json_encode(['error' => 'prompt too long']); exit;
}

// ─── Exercise library ────────────────────────────────────────────────────────
$exercises = [
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

$exerciseLines = implode("\n", array_map(
    fn($e) => "- {$e['id']} ({$e['category']}): {$e['name']}, targets {$e['muscles']}",
    $exercises
));

// ─── Build prompt ─────────────────────────────────────────────────────────────
$fullPrompt = <<<PROMPT
You are a fitness program designer. Create a workout routine based on this request: "{$userPrompt}"

Available exercises (use only these IDs):
{$exerciseLines}

Rules:
- Use only the exercise IDs listed above
- Include 4-16 exercises (repetition is fine)
- workDuration and restDuration are in seconds
- Yoga: work 30-60s, rest 10-15s
- HIIT: work 20-40s, rest 5-15s
- Strength: work 30-45s, rest 15-20s
- Match the requested duration as closely as possible

Respond with ONLY valid JSON, no explanation, no markdown:
{"name":"...","description":"...","category":"hiit|yoga|strength|cardio|core","workDuration":30,"restDuration":10,"exercises":["id1","id2"]}
PROMPT;

// ─── Call Gemini API ─────────────────────────────────────────────────────────
$model = 'gemini-2.0-flash';
$url   = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . GEMINI_API_KEY;

$payload = [
    'contents' => [
        ['parts' => [['text' => $fullPrompt]]]
    ],
    'generationConfig' => [
        'temperature'     => 0.7,
        'maxOutputTokens' => 1024,
    ],
];

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    http_response_code(502); echo json_encode(['error' => 'cURL error: ' . $curlErr]); exit;
}
if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'Gemini returned HTTP ' . $httpCode, 'detail' => json_decode($response, true)]);
    exit;
}

// ─── Parse response ───────────────────────────────────────────────────────────
$result = json_decode($response, true);
$text   = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

// Strip markdown code fences if present
$text = preg_replace('/^```(?:json)?\s*/i', '', trim($text));
$text = preg_replace('/\s*```$/', '', $text);

$workout = json_decode(trim($text), true);
if (!$workout || !isset($workout['exercises']) || !is_array($workout['exercises'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not parse workout from AI response', 'raw' => $text]);
    exit;
}

// ─── Validate exercise IDs ────────────────────────────────────────────────────
$validIds = array_column($exercises, 'id');
$workout['exercises'] = array_values(
    array_filter($workout['exercises'], fn($id) => in_array($id, $validIds, true))
);

if (empty($workout['exercises'])) {
    http_response_code(500); echo json_encode(['error' => 'No valid exercises in AI response', 'raw' => $text]); exit;
}

// Clamp durations to sane ranges
$workout['workDuration'] = max(10, min(120, intval($workout['workDuration'] ?? 30)));
$workout['restDuration'] = max(5,  min(60,  intval($workout['restDuration']  ?? 10)));

echo json_encode($workout);
