
function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

var RANDOM_SUPERVISORS = ['شهد', 'جنان', 'ريم', 'لمى', 'دانة', 'أثير', 'أروى', 'نجلاء', 'غادة', 'سارة', 'نوف', 'هيا'];

function pickRandomSupervisor(seedText) {
    var sum = 0;
    var s = String(seedText || '');
    for (var i = 0; i < s.length; i++) {
        sum += s.charCodeAt(i) * (i + 3);
    }
    return RANDOM_SUPERVISORS[sum % RANDOM_SUPERVISORS.length];
}

function randomMemberCount(minVal, maxVal) {
    var lo = minVal || 18;
    var hi = maxVal || 260;
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function downloadGeneratedFile(fileName, titleText, bodyText, extraMeta) {
    var safeName = fileName || ((titleText || 'ملف_دراسي').replace(/[^\w\u0600-\u06FF.-]/g, '_') + '.txt');
    var contentLines = [
        'UniLink - ملف دراسي ومصدر أكاديمي',
        '========================================',
        'العنوان: ' + (titleText || safeName),
        extraMeta ? ('بيانات إضافية: ' + extraMeta) : '',
        '----------------------------------------',
        bodyText || ('ملخص ومحتوى دراسي للملف: ' + safeName + '\nتم إنشاء هذا الملف عبر منصة UniLink للمراجعة والمذاكرة.')
    ].filter(Boolean).join('\n');

    var blob = new Blob([contentLines], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}


function getStudentsStorage() {
    try {
        var raw = localStorage.getItem('unilink_students_v11');
        if (raw !== null) return JSON.parse(raw || '[]');
        var defs = [
            {
                name: 'شهد',
                university: 'جامعة الأمير سطام بن عبدالعزيز',
                major: 'هندسة البرمجيات',
                email: 'shahad@unilink.edu.sa',
                role: 'طالب'
            },
            {
                name: 'جنان',
                university: 'جامعة الأمير سطام بن عبدالعزيز',
                major: 'هندسة البرمجيات',
                email: 'janan@unilink.edu.sa',
                role: 'طالب'
            },
            {
                name: 'أروى',
                university: 'جامعة الملك سعود',
                major: 'علوم الحاسب والمعلومات',
                email: 'arwa@unilink.edu.sa',
                role: 'طالب'
            },
            {
                name: 'حنين',
                university: 'جامعة الملك سعود',
                major: 'علوم الحاسب والمعلومات',
                email: 'haneen@unilink.edu.sa',
                role: 'طالب'
            },
            {
                name: 'نوره',
                university: 'جامعة الأميرة نورة بنت عبدالرحمن',
                major: 'علوم الحاسب والمعلومات',
                email: 'noura@unilink.edu.sa',
                role: 'طالب'
            },
            {
                name: 'نوف',
                university: 'جامعة الأميرة نورة بنت عبدالرحمن',
                major: 'علوم الحاسب والمعلومات',
                email: 'nouf@unilink.edu.sa',
                role: 'طالب'
            },
            {
                name: 'فاطمة',
                university: 'جامعة الأميرة نورة بنت عبدالرحمن',
                major: 'علوم الحاسب والمعلومات',
                email: 'fatima@unilink.edu.sa',
                role: 'طالب'
            },
            {
                name: 'مشرف الجامعات',
                university: 'كل الجامعات',
                major: 'الإشراف الأكاديمي العام',
                email: 'leader@unilink.edu.sa',
                role: 'ليدر'
            }
        ];
        localStorage.setItem('unilink_students_v11', JSON.stringify(defs));
        return defs;
    } catch (e) {
        return [];
    }
}

function saveStudentsStorage(list) {
    localStorage.setItem('unilink_students_v11', JSON.stringify(list));
}

function getUsers() {
    try { return JSON.parse(localStorage.getItem('unilink_users') || '[]'); }
    catch (e) { return []; }
}

function saveUsers(users) {
    localStorage.setItem('unilink_users', JSON.stringify(users));
}

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('unilink_current_user') || 'null'); }
    catch (e) { return null; }
}

function setCurrentUser(user) {
    localStorage.setItem('unilink_current_user', JSON.stringify(user));
}

function isLeaderUser(userObj) {
    var u = userObj || getCurrentUser();
    if (!u) return false;
    if (u.role === 'leader' || u.isAllUniversities === true) return true;
    var em = String(u.email || '').toLowerCase();
    return em.indexOf('leader') !== -1 || em.indexOf('ليدر') !== -1;
}

function resolveUserFromEmail(emailInput) {
    var email = String(emailInput || '').trim();
    var lower = email.toLowerCase();
    var users = getUsers();
    var found = users.find(function(u) { return String(u.email || '').toLowerCase() === lower; });
    if (found) return found;

    if (lower.indexOf('leader') !== -1 || lower.indexOf('ليدر') !== -1) {
        return {
            name: 'مشرف الجامعات',
            university: 'كل الجامعات',
            major: 'الإشراف الأكاديمي العام',
            email: email,
            role: 'leader',
            isAllUniversities: true
        };
    }

    if (lower.indexOf('janan') !== -1 || lower.indexOf('جنان') !== -1) {
        return {
            name: 'جنان',
            university: 'جامعة الأمير سطام بن عبدالعزيز',
            major: 'هندسة البرمجيات',
            email: email,
            role: 'student'
        };
    }

    if (lower.indexOf('arwa') !== -1 || lower.indexOf('أروى') !== -1 || lower.indexOf('اروى') !== -1 || lower.indexOf('نولره') !== -1 || lower.indexOf('ksu') !== -1) {
        var ksuName = 'أروى';
        if (lower.indexOf('نولره') !== -1) ksuName = 'نولره';
        else if (lower.indexOf('sara') !== -1 || lower.indexOf('سارة') !== -1) ksuName = 'سارة';
        return {
            name: ksuName,
            university: 'جامعة الملك سعود',
            major: 'علوم الحاسب والمعلومات',
            email: email,
            role: 'student'
        };
    }

    if (lower.indexOf('noura') !== -1 || lower.indexOf('نوره') !== -1 || lower.indexOf('pnu') !== -1) {
        return {
            name: 'نوره',
            university: 'جامعة الأميرة نورة بنت عبدالرحمن',
            major: 'علوم الحاسب والمعلومات',
            email: email,
            role: 'student'
        };
    }

    return {
        name: email.split('@')[0] || 'شهد',
        university: 'جامعة الأمير سطام بن عبدالعزيز',
        major: 'هندسة البرمجيات',
        email: email,
        role: 'student'
    };
}

function getSharedGroupsStorage() {
    try {
        var raw = localStorage.getItem('unilink_shared_groups_v9');
        if (raw !== null) return JSON.parse(raw || '[]');
        var defs = [
            {
                university: 'جامعة الأمير سطام بن عبدالعزيز',
                college: 'كلية الهندسة وعلوم الحاسب',
                level: '7',
                group_name: 'بناء البرمجيات',
                course_code: 'SE 4111',
                leader_name: 'شهد',
                meeting_time: 'الإثنين 5:00 مساءً',
                members: 145,
                author: 'شهد'
            },
            {
                university: 'جامعة الأمير سطام بن عبدالعزيز',
                college: 'كلية الهندسة وعلوم الحاسب',
                level: '7',
                group_name: 'ضمان جودة البرمجيات والاختبار',
                course_code: 'SE 4221',
                leader_name: 'جنان',
                meeting_time: 'الأربعاء 6:00 مساءً',
                members: 118,
                author: 'جنان'
            },
            {
                university: 'جامعة الأمير سطام بن عبدالعزيز',
                college: 'كلية الهندسة وعلوم الحاسب',
                level: '6',
                group_name: 'تطوير تطبيقات الويب',
                course_code: 'CS 3821',
                leader_name: 'ريم',
                meeting_time: 'الثلاثاء 7:00 مساءً',
                members: 94,
                author: 'شهد'
            },
            {
                university: 'جامعة الملك سعود',
                college: 'كلية علوم الحاسب والمعلومات',
                level: '5',
                group_name: 'هندسة المتطلبات',
                course_code: 'SWE 312',
                leader_name: 'أروى',
                meeting_time: 'الإثنين 4:30 مساءً',
                members: 162,
                author: 'أروى'
            },
            {
                university: 'جامعة الأميرة نورة بنت عبدالرحمن',
                college: 'كلية علوم الحاسب والمعلومات',
                level: '3',
                group_name: 'تطوير الويب',
                course_code: 'WEB 210',
                leader_name: 'دانة',
                meeting_time: 'الأحد 5:00 مساءً',
                members: 127,
                author: 'نوره'
            },
            {
                university: 'جامعة الأميرة نورة بنت عبدالرحمن',
                college: 'كلية علوم الحاسب والمعلومات',
                level: '4',
                group_name: 'قواعد البيانات',
                course_code: 'DB 240',
                leader_name: 'أثير',
                meeting_time: 'الثلاثاء 6:00 مساءً',
                members: 88,
                author: 'نوره'
            }
        ];
        localStorage.setItem('unilink_shared_groups_v9', JSON.stringify(defs));
        return defs;
    } catch (e) {
        return [];
    }
}

function saveSharedGroupsStorage(list) {
    localStorage.setItem('unilink_shared_groups_v9', JSON.stringify(list));
}

function getGroups() {
    return getSharedGroupsStorage();
}

function saveGroups(groups) {
    saveSharedGroupsStorage(groups);
}

function getSharedContentsStorage() {
    try {
        var raw = localStorage.getItem('unilink_shared_contents_v9');
        if (raw !== null) return JSON.parse(raw || '[]');
        var defs = [
            {
                university: 'جامعة الأمير سطام بن عبدالعزيز',
                course_code: 'SE 4221',
                title: 'ملخص هندسة البرمجيات والاختبار (JUnit & Mockito)',
                content_type: 'ملف',
                summary: 'شروحات وأمثلة عملية لاختبارات الوحدة والنمذجة الوهمية. تغطية شاملة لـ JUnit 5 و Mockito وحالات الاختبار وضمان الجودة.',
                text_body: 'شرح تفصيلي لاختبارات الوحدة Unit Testing والنمذجة الوهمية Mocking وأمثلة عملية على الاختبارات.',
                file_name: 'QA_Testing_Summary.pdf',
                author: 'شهد'
            },
            {
                university: 'جامعة الأمير سطام بن عبدالعزيز',
                course_code: 'SE 4111',
                title: 'ملاحظات مراجعة قواعد البيانات و SQL',
                content_type: 'نص',
                summary: 'أهم استعلامات JOIN والتطبيع قبل الاختبار.',
                text_body: 'تأكدي من فهم مفاتيح الربط الأساسية والأجنبية (PK/FK) وحالات NORMALIZATION من 1NF إلى 3NF.',
                file_name: '',
                author: 'جنان'
            },
            {
                university: 'جامعة الملك سعود',
                course_code: 'SWE 312',
                title: 'ملخص هندسة المتطلبات SWE 312',
                content_type: 'ملف',
                summary: 'توثيق المتطلبات الوظيفية وغير الوظيفية وحالات الاستخدام. يشمل تحليل أصحاب المصلحة ومواصفات المتطلبات.',
                text_body: 'المتطلبات الوظيفية Functional Requirements وغير الوظيفية Non-Functional Requirements وحالات الاستخدام Use Cases.',
                file_name: 'SWE312_Requirements.pdf',
                author: 'أروى'
            },
            {
                university: 'جامعة الأميرة نورة بنت عبدالرحمن',
                course_code: 'WEB 210',
                title: 'دليل تصميم واجهات المستخدم (UI/UX)',
                content_type: 'ملف',
                summary: 'أساسيات التباين اللوني وتنظيم العناصر في الواجهات. يوضح قواعد التسلسل البصري وتجربة المستخدم.',
                text_body: 'مبادئ التباين اللوني والخطوط الواضحة وتوزيع المساحات البيضاء لتحسين تجربة المستخدم.',
                file_name: 'UI_Design_Checklist.pdf',
                author: 'نوره'
            }
        ];
        localStorage.setItem('unilink_shared_contents_v9', JSON.stringify(defs));
        return defs;
    } catch (e) {
        return [];
    }
}

function saveSharedContentsStorage(list) {
    localStorage.setItem('unilink_shared_contents_v9', JSON.stringify(list));
}

function getContents() {
    return getSharedContentsStorage();
}

function saveContents(contents) {
    saveSharedContentsStorage(contents);
}

function getAllContentsForActiveUni() {
    var currentUser = getCurrentUser();
    var allItems = getSharedContentsStorage();
    if (!currentUser || isLeaderUser(currentUser)) {
        return allItems;
    }
    var activeUni = currentUser.university;
    if (!activeUni || activeUni === 'كل الجامعات') {
        return allItems;
    }
    return allItems.filter(function(item) {
        return !item.university || item.university === activeUni || item.university === 'كل الجامعات';
    });
}

function getSharedGroupFilesStorage() {
    try {
        var raw = localStorage.getItem('unilink_shared_group_files_v9');
        if (raw !== null) return JSON.parse(raw || '{}');
        var defs = {
            'SE 4111': [
                {
                    title: 'مذكرة بناء البرمجيات - الفصل الأول',
                    fileName: 'SE4111_Lecture_01.pdf',
                    note: 'شرح مبادئ التصميم وهيكلة الكود النظيف.',
                    author: 'شهد'
                }
            ],
            'SE 4221': [
                {
                    title: 'نموذج خطة اختبار IEEE 829 وحالات Katalon',
                    fileName: 'IEEE829_Katalon_Guide.pdf',
                    note: 'توثيق حالات الاختبار وتقارير التغطية.',
                    author: 'جنان'
                }
            ],
            'CS 3821': [
                {
                    title: 'أساسيات HTML و CSS و JavaScript',
                    fileName: 'WebDev_Starter_Notes.pdf',
                    note: 'ملخص بناء الصفحات وتنسيق الواجهات.',
                    author: 'شهد'
                }
            ],
            'SWE 312': [
                {
                    title: 'توثيق متطلبات النظام SWE 312',
                    fileName: 'Requirements_Spec_SWE312.pdf',
                    note: 'أمثلة عملية على صياغة المتطلبات.',
                    author: 'أروى'
                }
            ],
            'WEB 210': [
                {
                    title: 'ملخص أساسيات تطوير الويب',
                    fileName: 'WEB210_Summary.pdf',
                    note: 'مراجعة العناصر والنماذج التفاعلية.',
                    author: 'نوره'
                }
            ],
            'DB 240': [
                {
                    title: 'ملخص قواعد البيانات واستعلامات SQL',
                    fileName: 'DB240_SQL_Sheet.pdf',
                    note: 'أمثلة على الاستعلامات والجداول.',
                    author: 'نوره'
                }
            ]
        };
        localStorage.setItem('unilink_shared_group_files_v9', JSON.stringify(defs));
        return defs;
    } catch (e) {
        return {};
    }
}

function saveSharedGroupFilesStorage(obj) {
    localStorage.setItem('unilink_shared_group_files_v9', JSON.stringify(obj));
}

function getGroupFiles(groupKey) {
    var all = getSharedGroupFilesStorage();
    var key = groupKey || 'default';
    if (all[key]) return all[key];
    return all['SE 4111'] || [];
}

function addGroupFile(groupKey, item) {
    var all = getSharedGroupFilesStorage();
    var key = groupKey || 'default';
    if (!all[key]) all[key] = [];
    all[key].unshift(item);
    saveSharedGroupFilesStorage(all);
}

function handleUniversitySelect(uniTitle, isSupported) {
    if (!isSupported) {
        alert('عذراً، الانتقال المباشر متاح حالياً لجامعات: الملك سعود، الأمير سطام بن عبدالعزيز، والأميرة نورة بنت عبدالرحمن فقط.');
    }
}
