<?php
// ─── List available Gemini models that support image generation ───────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

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

require_once __DIR__ . '/fb_auth_check.php';
require_auth($pdo);

// ─── Gemini config ───────────────────────────────────────────────────────────
$configFile = __DIR__ . '/config.local.php';
if (file_exists($configFile)) { require_once $configFile; }
if (!defined('GEMINI_API_KEY')) {
    $envKey = getenv('GEMINI_API_KEY');
    if ($envKey) define('GEMINI_API_KEY', $envKey);
    else { http_response_code(500); echo json_encode(['error' => 'Gemini API key not configured']); exit; }
}

// ─── Fetch models from Gemini API ────────────────────────────────────────────
$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . GEMINI_API_KEY . "&pageSize=100";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr || $httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch models', 'detail' => $curlErr ?: $httpCode]);
    exit;
}

$data = json_decode($response, true);
$allModels = $data['models'] ?? [];

// Filter for models that support generateContent and image output
$imageModels = [];
foreach ($allModels as $model) {
    $methods = $model['supportedGenerationMethods'] ?? [];
    $name = $model['name'] ?? '';
    $displayName = $model['displayName'] ?? $name;

    // Only include models that support generateContent
    if (!in_array('generateContent', $methods)) continue;

    // Extract short model id (strip "models/" prefix)
    $id = preg_replace('/^models\//', '', $name);

    // Prefer models with "image" in the name or known image-capable models
    // Include all generateContent models so user can experiment
    $imageModels[] = [
        'id'          => $id,
        'displayName' => $displayName,
        'description' => $model['description'] ?? '',
    ];
}

// Sort: image-related models first, then alphabetically
usort($imageModels, function ($a, $b) {
    $aImg = (stripos($a['id'], 'image') !== false) ? 0 : 1;
    $bImg = (stripos($b['id'], 'image') !== false) ? 0 : 1;
    if ($aImg !== $bImg) return $aImg - $bImg;
    return strcmp($a['id'], $b['id']);
});

echo json_encode(['models' => $imageModels]);
