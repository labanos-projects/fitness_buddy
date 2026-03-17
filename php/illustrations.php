<?php
// ─── Exercise Illustrations API ──────────────────────────────────────────────
// GET  ?exercise_id=squats           → all frames for that exercise
// GET  (no params)                   → list of exercise IDs that have illustrations
// POST {exercise_id, frame_number, image_base64, mime_type}  → upsert a frame

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

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
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

require_once __DIR__ . '/fb_auth_check.php';

// ── Schema (idempotent) ──────────────────────────────────────────────────────
$pdo->exec("CREATE TABLE IF NOT EXISTS exercise_illustrations (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id   VARCHAR(60)  NOT NULL,
    frame_number  TINYINT      NOT NULL DEFAULT 1,
    image_base64  MEDIUMTEXT   NOT NULL,
    mime_type     VARCHAR(30)  NOT NULL DEFAULT 'image/png',
    prompt_used   TEXT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_exercise_frame (exercise_id, frame_number),
    INDEX idx_exercise (exercise_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_GET['_method'])) {
    $override = strtoupper(trim($_GET['_method']));
    if ($override === 'DELETE') $method = 'DELETE';
}

// ── GET ──────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $exerciseId = trim($_GET['exercise_id'] ?? '');

    if ($exerciseId) {
        // Return all frames for a specific exercise
        $stmt = $pdo->prepare(
            "SELECT exercise_id, frame_number, image_base64, mime_type, prompt_used, created_at
             FROM exercise_illustrations
             WHERE exercise_id = ?
             ORDER BY frame_number ASC"
        );
        $stmt->execute([$exerciseId]);
        $frames = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['exercise_id' => $exerciseId, 'frames' => $frames]);
    } else {
        // Return list of exercises that have illustrations
        $stmt = $pdo->query(
            "SELECT exercise_id, COUNT(*) as frame_count, MAX(updated_at) as last_updated
             FROM exercise_illustrations
             GROUP BY exercise_id
             ORDER BY exercise_id"
        );
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    exit;
}

// ── POST ─────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    require_auth($pdo);

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) { http_response_code(400); echo json_encode(['error' => 'Invalid JSON']); exit; }

    $exerciseId  = trim($data['exercise_id'] ?? '');
    $frameNumber = (int)($data['frame_number'] ?? 1);
    $imageBase64 = $data['image_base64'] ?? '';
    $mimeType    = trim($data['mime_type'] ?? 'image/png');
    $promptUsed  = trim($data['prompt_used'] ?? '');

    if (!$exerciseId || !$imageBase64) {
        http_response_code(400);
        echo json_encode(['error' => 'exercise_id and image_base64 required']);
        exit;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO exercise_illustrations (exercise_id, frame_number, image_base64, mime_type, prompt_used)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE image_base64=VALUES(image_base64), mime_type=VALUES(mime_type),
                                 prompt_used=VALUES(prompt_used), updated_at=NOW()"
    );
    $stmt->execute([$exerciseId, $frameNumber, $imageBase64, $mimeType, $promptUsed]);

    echo json_encode(['success' => true, 'exercise_id' => $exerciseId, 'frame_number' => $frameNumber]);
    exit;
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    require_auth($pdo);

    $exerciseId  = trim($_GET['exercise_id'] ?? '');
    $frameNumber = isset($_GET['frame_number']) ? (int)$_GET['frame_number'] : null;

    if (!$exerciseId) {
        http_response_code(400);
        echo json_encode(['error' => 'exercise_id required']);
        exit;
    }

    if ($frameNumber !== null) {
        $stmt = $pdo->prepare("DELETE FROM exercise_illustrations WHERE exercise_id = ? AND frame_number = ?");
        $stmt->execute([$exerciseId, $frameNumber]);
    } else {
        $stmt = $pdo->prepare("DELETE FROM exercise_illustrations WHERE exercise_id = ?");
        $stmt->execute([$exerciseId]);
    }

    echo json_encode(['success' => true, 'deleted' => $stmt->rowCount()]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
# deployed 2026-03-11T17:13:15Z
