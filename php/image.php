<?php
// ─── Serve exercise illustration as binary image with caching ────────────────
// GET ?exercise_id=squats&frame=1  → raw image with cache headers
// GET ?exercise_id=squats          → frame 1 by default

define('DB_HOST', '%%DB_HOST%%');
define('DB_NAME', '%%DB_NAME%%');
define('DB_USER', '%%DB_USER%%');
define('DB_PASS', '%%DB_PASS%%');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$exerciseId  = trim($_GET['exercise_id'] ?? '');
$frameNumber = (int)($_GET['frame'] ?? 1);

if (!$exerciseId) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'exercise_id required']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

$stmt = $pdo->prepare(
    "SELECT image_base64, mime_type, updated_at
     FROM exercise_illustrations
     WHERE exercise_id = ? AND frame_number = ?
     LIMIT 1"
);
$stmt->execute([$exerciseId, $frameNumber]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not found']);
    exit;
}

$imageData = base64_decode($row['image_base64']);
$mimeType  = $row['mime_type'] ?: 'image/png';
$updatedAt = $row['updated_at'];

// Generate ETag from content hash
$etag = '"' . md5($exerciseId . $frameNumber . $updatedAt) . '"';

// Check If-None-Match → 304 Not Modified
if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
    http_response_code(304);
    exit;
}

// Compress and normalize size if GD is available
if (function_exists('imagecreatefromstring')) {
    $img = @imagecreatefromstring($imageData);
    if ($img) {
        $w = imagesx($img);
        $h = imagesy($img);
        $maxDim = 1024;

        // Resize if either dimension exceeds max
        if ($w > $maxDim || $h > $maxDim) {
            if ($w >= $h) {
                $newW = $maxDim;
                $newH = (int)($h * $maxDim / $w);
            } else {
                $newH = $maxDim;
                $newW = (int)($w * $maxDim / $h);
            }
            $resized = imagecreatetruecolor($newW, $newH);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $img, 0, 0, 0, 0, $newW, $newH, $w, $h);
            imagedestroy($img);
            $img = $resized;
        }

        // Output as optimized PNG (compression level 9)
        ob_start();
        imagepng($img, null, 9);
        $imageData = ob_get_clean();
        $mimeType = 'image/png';
        imagedestroy($img);
    }
}

// Cache headers: cache for 7 days, revalidate with ETag
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . strlen($imageData));
header('Cache-Control: public, max-age=604800, must-revalidate');
header('ETag: ' . $etag);
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', strtotime($updatedAt)) . ' GMT');

echo $imageData;
