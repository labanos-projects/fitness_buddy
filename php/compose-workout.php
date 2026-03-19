<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Load Gemini API key
$configFile = __DIR__ . '/config.local.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration missing']);
    exit;
}
require_once $configFile;

$body = json_decode(file_get_contents('php://input'), true);
$userPrompt = trim($body['prompt'] ?? '');

if (empty($userPrompt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Prompt is required']);
    exit;
}

if (strlen($userPrompt) > 500) {
    http_response_code(400);
    echo json_encode(['error' => 'Prompt too long']);
    exit;
}

// Exercise library (mirrors src/data/exercises.json)
$exercises = [
    ['id' => 'jumping-jacks',      'name' => 'Jumping Jacks',           'category' => 'cardio',    'muscles' => ['full-body']],
    ['id' => 'wall-sit',           'name' => 'Wall Sit',                'category' => 'strength',  'muscles' => ['quads', 'glutes']],
    ['id' => 'push-ups',           'name' => 'Push-Ups',                'category' => 'strength',  'muscles' => ['chest', 'triceps', 'shoulders']],
    ['id' => 'crunches',           'name' => 'Abdominal Crunches',      'category' => 'strength',  'muscles' => ['abs']],
    ['id' => 'step-ups',           'name' => 'Step-Ups',                'category' => 'strength',  'muscles' => ['quads', 'glutes']],
    ['id' => 'squats',             'name' => 'Squats',                  'category' => 'strength',  'muscles' => ['quads', 'glutes', 'hamstrings']],
    ['id' => 'tricep-dips',        'name' => 'Tricep Dips',             'category' => 'strength',  'muscles' => ['triceps', 'shoulders']],
    ['id' => 'plank',              'name' => 'Plank',                   'category' => 'strength',  'muscles' => ['core', 'shoulders']],
    ['id' => 'high-knees',         'name' => 'High Knees',              'category' => 'cardio',    'muscles' => ['full-body']],
    ['id' => 'lunges',             'name' => 'Lunges',                  'category' => 'strength',  'muscles' => ['quads', 'glutes', 'hamstrings']],
    ['id' => 'push-up-rotation',   'name' => 'Push-Up with Rotation',   'category' => 'strength',  'muscles' => ['chest', 'core', 'shoulders']],
    ['id' => 'side-plank',         'name' => 'Side Plank',              'category' => 'strength',  'muscles' => ['obliques', 'core']],
    ['id' => 'cat-cow',            'name' => 'Cat-Cow Flow',            'category' => 'yoga',      'muscles' => ['spine', 'core']],
    ['id' => 'downward-dog',       'name' => 'Downward Dog',            'category' => 'yoga',      'muscles' => ['hamstrings', 'shoulders', 'back']],
    ['id' => 'warrior-ii',         'name' => 'Warrior II',              'category' => 'yoga',      'muscles' => ['legs', 'hips', 'shoulders']],
    ['id' => 'childs-pose',        'name' => "Child's Pose",           'category' => 'yoga',      'muscles' => ['back', 'hips']],
    ['id' => 'seated-forward-fold','name' => 'Seated Forward Fold',     'category' => 'yoga',      'muscles' => ['hamstrings', 'back']],
];

$exerciseListJson = json_encode($exercises, JSON_PRETTY_PRINT);

$systemPrompt = <<<PROMPT
You are a fitness program designer. Create a workout routine from the exercise library below based on the user's request.

Available exercises:
{$exerciseListJson}

Rules:
- Only use exercise IDs from the list above
- Return valid JSON only — no markdown, no explanation
- workDuration and restDuration are in seconds
- Include 4–16 exercises (repetition allowed)
- Match the user's intent: duration, type, intensity, body area
- Yoga sessions: longer durations (30–60s), shorter rest (10–15s)
- HIIT sessions: shorter durations (20–40s), short rest (5–15s)
- Strength sessions: medium durations (30–45s), medium rest (15–20s)
- Estimate total time: (count * workDuration) + ((count - 1) * restDuration)

Return ONLY this JSON structure:
{
  "name": "Short workout name",
  "description": "One sentence description",
  "category": "hiit|yoga|strength|cardio|core",
  "workDuration": 30,
  "restDuration": 10,
  "exercises": ["exercise-id-1", "exercise-id-2"]
}
PROMPT;

$requestBody = json_encode([
    'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
    'contents' => [['parts' => [['text' => $userPrompt]]]],
    'generationConfig' => [
        'temperature' => 0.7,
        'maxOutputTokens' => 1024,
        'responseMimeType' => 'application/json',
    ],
]);

$model = 'gemini-2.0-flash';
$apiKey = defined('GEMINI_API_KEY') ? GEMINI_API_KEY : '';
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'AI service unavailable', 'details' => $response]);
    exit;
}

$data = json_decode($response, true);
$text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

$workout = json_decode($text, true);
if (!$workout || !isset($workout['exercises']) || !is_array($workout['exercises'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to parse workout from AI response']);
    exit;
}

// Validate and filter exercise IDs
$validIds = array_column($exercises, 'id');
$workout['exercises'] = array_values(
    array_filter($workout['exercises'], fn($id) => in_array($id, $validIds))
);

if (empty($workout['exercises'])) {
    http_response_code(500);
    echo json_encode(['error' => 'No valid exercises in AI response']);
    exit;
}

// Ensure sane numeric values
$workout['workDuration'] = max(10, min(120, intval($workout['workDuration'] ?? 30)));
$workout['restDuration'] = max(5,  min(60,  intval($workout['restDuration']  ?? 10)));

echo json_encode($workout);
