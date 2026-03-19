<?php
// ─── Auto-Illustrate new exercise ────────────────────────────────────────────
// POST { exercise_id, name, description, category, muscles }
// Public endpoint — no auth required, but idempotent:
// if an illustration already exists in the DB it returns immediately (skip).
set_time_limit(150);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

// ─── DB connection ────────────────────────────────────────────────────────────
define('DB_HOST', '%%DB_HOST%%');
define('DB_NAME', '%%DB_NAME%%');
define('DB_USER', '%%DB_USER%%');
define('DB_PASS', '%%DB_PASS%%');

try {
    $pdo = new PDO(
        'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    http_response_code(500); echo json_encode(['error' => 'DB connection failed']); exit;
}

// ─── Gemini config ────────────────────────────────────────────────────────────
$configFile = __DIR__ . '/config.local.php';
if (file_exists($configFile)) { require_once $configFile; }
if (!defined('GEMINI_API_KEY')) {
    $envKey = getenv('GEMINI_API_KEY');
    if ($envKey) define('GEMINI_API_KEY', $envKey);
    else { http_response_code(500); echo json_encode(['error' => 'Gemini API key not configured']); exit; }
}

// ─── Parse request ────────────────────────────────────────────────────────────
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) { http_response_code(400); echo json_encode(['error' => 'Invalid JSON']); exit; }

$exerciseId  = trim($data['exercise_id']  ?? '');
$name        = trim($data['name']         ?? '');
$description = trim($data['description']  ?? '');
$category    = trim($data['category']     ?? 'strength');
$muscles     = $data['muscles'] ?? [];

if (!$exerciseId || !$name) {
    http_response_code(400); echo json_encode(['error' => 'exercise_id and name required']); exit;
}

// Validate exercise_id is sane (kebab-case only, max 80 chars)
if (!preg_match('/^[a-z0-9\-]{1,80}$/', $exerciseId)) {
    http_response_code(400); echo json_encode(['error' => 'Invalid exercise_id']); exit;
}

// ─── Idempotency check — skip if illustration already exists ──────────────────
$check = $pdo->prepare('SELECT COUNT(*) FROM exercise_illustrations WHERE exercise_id = ?');
$check->execute([$exerciseId]);
if ($check->fetchColumn() > 0) {
    echo json_encode(['skipped' => true, 'exercise_id' => $exerciseId, 'reason' => 'already illustrated']);
    exit;
}

// ─── Build illustration prompt ────────────────────────────────────────────────
$muscleStr = is_array($muscles) ? implode(', ', $muscles) : (string)$muscles;
$catLabel  = ucfirst($category);

$prompt = "Two-frame movement breakdown illustration for a fitness app exercise called \"{$name}\".\n\n";

if ($description) {
    $prompt .= "Exercise description: {$description}\n\n";
}

$prompt .= "Category: {$catLabel}. Target muscles: {$muscleStr}.\n\n";
$prompt .= "Show two side-by-side frames:\n";
$prompt .= "- Frame 1: starting/rest position\n";
$prompt .= "- Frame 2: peak of the movement\n\n";

// Standard character style (same as regenerate.php)
$prompt .= "The figure has a simple, minimal design with solid color fills (teal/cyan sports bra and dark gray/navy leggings), no facial details, light skin tone, brown hair in a ponytail. Clean geometric body proportions, no outlines, soft flat shading. Fitness app UI style, consistent character design across all poses. No text, no background elements, no shadows on the ground.\n\n";
$prompt .= "Output a square 1024x1024 pixel image.";

// ─── Call Gemini image model ──────────────────────────────────────────────────
$GEMINI_MODEL = 'gemini-2.5-flash-image';
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$GEMINI_MODEL}:generateContent?key=" . GEMINI_API_KEY;

$payload = [
    'contents' => [['parts' => [['text' => $prompt]]]],
    'generationConfig' => ['responseModalities' => ['image', 'text']],
];

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT        => 120,
]);
$response = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr   = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    http_response_code(502); echo json_encode(['error' => 'Gemini request failed: ' . $curlErr]); exit;
}
if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'Gemini returned HTTP ' . $httpCode, 'detail' => json_decode($response, true)]);
    exit;
}

$result = json_decode($response, true);
$parts  = $result['candidates'][0]['content']['parts'] ?? [];

// Find image part
$imageData = null;
$mimeType  = 'image/png';
foreach ($parts as $part) {
    if (isset($part['inlineData']['mimeType']) && strncmp($part['inlineData']['mimeType'], 'image/', 6) === 0) {
        $imageData = $part['inlineData']['data'];
        $mimeType  = $part['inlineData']['mimeType'];
        break;
    }
}

if (!$imageData) {
    http_response_code(502); echo json_encode(['error' => 'No image generated by Gemini']); exit;
}

// ─── Store in DB ──────────────────────────────────────────────────────────────
$stmt = $pdo->prepare(
    "INSERT INTO exercise_illustrations (exercise_id, frame_number, image_base64, mime_type, prompt_used)
     VALUES (?, 1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE image_base64=VALUES(image_base64), mime_type=VALUES(mime_type),
                             prompt_used=VALUES(prompt_used), updated_at=NOW()"
);
$stmt->execute([$exerciseId, $imageData, $mimeType, $prompt]);

echo json_encode([
    'success'     => true,
    'exercise_id' => $exerciseId,
]);
