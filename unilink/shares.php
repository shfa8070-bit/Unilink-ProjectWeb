<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $uni = trim($_GET['university'] ?? '');
    $course = trim($_GET['course_code'] ?? '');

    $sql = "SELECT * FROM shares_table WHERE 1=1";
    $params = [];
    $types = "";

    if ($uni !== '') {
        $sql .= " AND university LIKE ?";
        $params[] = "%$uni%";
        $types .= "s";
    }
    if ($course !== '') {
        $sql .= " AND course_code LIKE ?";
        $params[] = "%$course%";
        $types .= "s";
    }
    $sql .= " ORDER BY id DESC";

    $stmt = $conn->prepare($sql);
    if ($types !== '') {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) {
        $rows[] = $r;
    }
    echo json_encode(['ok' => true, 'shares' => $rows], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data) || empty($data)) {
        $data = $_POST;
    }

    $uni = trim($data['university'] ?? ($data['adm-c-uni'] ?? ''));
    $course = trim($data['course_code'] ?? ($data['adm-c-code'] ?? ''));
    $title = trim($data['title'] ?? ($data['adm-c-title'] ?? ''));
    $contentType = trim($data['content_type'] ?? 'ملخص');
    $textBody = $data['text_body'] ?? '';
    $summary = trim($data['summary'] ?? ($data['adm-c-summary'] ?? ''));

    $fileName = '';
    $filePath = '';

    $uploadDir = __DIR__ . '/uploads';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    foreach (['source_file', 'file-upload', 'adm-c-file'] as $field) {
        if (!empty($_FILES[$field]['name']) && $_FILES[$field]['error'] === UPLOAD_ERR_OK) {
            $orig = basename($_FILES[$field]['name']);
            $safe = time() . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $orig);
            $dest = $uploadDir . '/' . $safe;
            if (move_uploaded_file($_FILES[$field]['tmp_name'], $dest)) {
                $fileName = $orig;
                $filePath = 'php/uploads/' . $safe;
            }
            break;
        }
    }

    if ($uni === '' || $course === '' || $title === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'يرجى إدخال الجامعة ورمز المقرر والعنوان'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO shares_table (university, course_code, title, content_type, text_body, summary, file_name, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssss", $uni, $course, $title, $contentType, $textBody, $summary, $fileName, $filePath);
    if ($stmt->execute()) {
        echo json_encode([
            'ok' => true,
            'id' => $stmt->insert_id,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'message' => 'تمت إضافة المشاركة بنجاح'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'فشل حفظ المشاركة'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'معرف المشاركة غير صالح'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM shares_table WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(['ok' => true, 'message' => 'تم حذف المشاركة'], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'الطريقة غير مدعومة'], JSON_UNESCAPED_UNICODE);
