<?php
require_once __DIR__ . '/config.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$action = $data['action'] ?? ($_GET['action'] ?? '');

if ($action === 'register') {
    $name = trim($data['student-name'] ?? ($data['student_name'] ?? ''));
    $university = trim($data['university'] ?? '');
    $major = trim($data['major'] ?? '');
    $email = trim($data['reg-email'] ?? ($data['email'] ?? ''));
    $password = $data['reg-password'] ?? ($data['password'] ?? '');

    if ($name === '' || $university === '' || $major === '' || $email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'يرجى تعبئة جميع الحقول المطلوبة'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'error' => 'البريد الإلكتروني مسجل مسبقاً'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $stmt->close();

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $otp = (string)random_int(100000, 999999);

    $ins = $conn->prepare("INSERT INTO users (student_name, university, major, email, password_hash, verified, otp_code) VALUES (?, ?, ?, ?, ?, 0, ?)");
    $ins->bind_param("ssssss", $name, $university, $major, $email, $hash, $otp);
    if ($ins->execute()) {
        echo json_encode([
            'ok' => true,
            'message' => 'تم إنشاء الحساب بنجاح',
            'otp_code' => $otp,
            'user' => [
                'id' => $ins->insert_id,
                'student_name' => $name,
                'university' => $university,
                'major' => $major,
                'email' => $email,
                'role' => 'student'
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'تعذر حفظ المستخدم'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

if ($action === 'login') {
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'أدخل البريد الإلكتروني وكلمة المرور'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, student_name, university, major, email, password_hash, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $user = $res->fetch_assoc();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'بيانات الدخول غير صحيحة'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'user' => [
            'id' => (int)$user['id'],
            'student_name' => $user['student_name'],
            'university' => $user['university'],
            'major' => $user['major'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'verify') {
    $email = trim($data['university-email'] ?? ($data['email'] ?? ''));
    $otp = trim($data['otp-code'] ?? ($data['otp'] ?? ''));

    if ($email === '' || $otp === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'أدخل البريد الجامعي ورمز التحقق'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, otp_code FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || $user['otp_code'] !== $otp) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'رمز التحقق غير صحيح'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $upd = $conn->prepare("UPDATE users SET verified = 1, otp_code = NULL WHERE id = ?");
    $upd->bind_param("i", $user['id']);
    $upd->execute();

    echo json_encode(['ok' => true, 'message' => 'تم تأكيد البريد الجامعي بنجاح'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'forgot') {
    $email = trim($data['reset-email'] ?? ($data['email'] ?? ''));
    if ($email === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'أدخل البريد الإلكتروني'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $code = (string)random_int(100000, 999999);
    $stmt = $conn->prepare("UPDATE users SET otp_code = ? WHERE email = ?");
    $stmt->bind_param("ss", $code, $email);
    $stmt->execute();

    echo json_encode([
        'ok' => true,
        'message' => 'تم إرسال رمز استعادة كلمة المرور',
        'reset_code' => $code
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'إجراء غير معروف'], JSON_UNESCAPED_UNICODE);
