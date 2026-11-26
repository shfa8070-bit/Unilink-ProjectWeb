<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $uni = trim($_GET['university'] ?? '');
    $level = trim($_GET['level'] ?? '');

    $sql = "SELECT * FROM groups_table WHERE 1=1";
    $params = [];
    $types = "";

    if ($uni !== '') {
        $sql .= " AND university LIKE ?";
        $params[] = "%$uni%";
        $types .= "s";
    }
    if ($level !== '') {
        $sql .= " AND level = ?";
        $params[] = $level;
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
    echo json_encode(['ok' => true, 'groups' => $rows], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $data = $_POST;
    }

    $uni = trim($data['university'] ?? ($data['adm-g-uni'] ?? ''));
    $college = trim($data['college'] ?? '');
    $level = trim($data['level'] ?? '');
    $groupName = trim($data['group_name'] ?? ($data['adm-g-name'] ?? ''));
    $courseCode = trim($data['course_code'] ?? ($data['adm-g-code'] ?? ''));
    $leaderName = trim($data['leader_name'] ?? ($data['adm-g-leader'] ?? ''));
    $meetingTime = trim($data['meeting_time'] ?? ($data['adm-g-time'] ?? ''));

    if ($uni === '' || $groupName === '' || $courseCode === '' || $leaderName === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'يرجى إدخال بيانات المجموعة المطلوبة'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO groups_table (university, college, level, group_name, course_code, leader_name, meeting_time) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $uni, $college, $level, $groupName, $courseCode, $leaderName, $meetingTime);
    if ($stmt->execute()) {
        echo json_encode(['ok' => true, 'id' => $stmt->insert_id, 'message' => 'تمت إضافة المجموعة'], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'فشل حفظ المجموعة'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'معرف المجموعة غير صالح'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM groups_table WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(['ok' => true, 'message' => 'تم حذف المجموعة'], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'الطريقة غير مدعومة'], JSON_UNESCAPED_UNICODE);
