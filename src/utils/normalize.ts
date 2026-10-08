import { Student, AssignmentRecord, DayOfWeek, ALL_DAYS } from '../types';

const parseBoolean = (val: any): boolean => {
  if (val === true || val === 1 || val === '1') return true;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    return lower === 'true' || lower === 'y' || lower === 'yes';
  }
  return false;
};

export const parseClassDays = (val: any): DayOfWeek[] => {
  if (Array.isArray(val)) {
    const valid = val.filter((d): d is DayOfWeek => ALL_DAYS.includes(d as DayOfWeek));
    return valid.length > 0 ? valid : ['화', '목'];
  }
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((d): d is DayOfWeek => ALL_DAYS.includes(d as DayOfWeek));
        if (valid.length > 0) return valid;
      }
    } catch {}
    // Comma separated or space separated: e.g. "월, 화" or "월,화"
    const splitDays = val.split(/[,/\s]+/).map((s) => s.trim());
    const valid = splitDays.filter((d): d is DayOfWeek => ALL_DAYS.includes(d as DayOfWeek));
    if (valid.length > 0) return valid;
  }
  return ['화', '목'];
};

export const sanitizeStudent = (s: any): Student => {
  if (!s || typeof s !== 'object') {
    return {
      id: `std-${Date.now()}`,
      name: '학생',
      school: '미지정',
      grade: '중2',
      studentPhone: '010-0000-0000',
      parentPhone: '010-0000-0000',
      classDays: ['화', '목'],
      regularTeacher: '최광민 선생님',
      examTeacher: '오성민 원장님',
      memo: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  const days = parseClassDays(s.classDays);
  const studentName = String(s.name || '').trim();

  return {
    id: String(s.id || `std-${Date.now()}`),
    name: studentName || '학생',
    school: String(s.school || '미지정').trim(),
    grade: String(s.grade || '중2').trim(),
    studentPhone: String(s.studentPhone || '010-0000-0000').trim(),
    parentPhone: String(s.parentPhone || '010-0000-0000').trim(),
    classDays: days.length > 0 ? days : ['화', '목'],
    regularTeacher: String(s.regularTeacher || '최광민 선생님').trim() || '최광민 선생님',
    examTeacher: String(s.examTeacher || s.regularTeacher || '오성민 원장님').trim() || '오성민 원장님',
    memo: String(s.memo || '').trim(),
    createdAt: String(s.createdAt || new Date().toISOString()),
    updatedAt: String(s.updatedAt || new Date().toISOString())
  };
};

export const sanitizeAssignment = (a: any): AssignmentRecord => {
  if (!a || typeof a !== 'object') {
    return {
      id: `asg-${Date.now()}`,
      studentId: '',
      studentName: '학생',
      date: new Date().toISOString().slice(0, 10),
      dayOfWeek: '수',
      mode: 'regular',
      teacher: '최광민 선생님',
      bookTitle: '지정 교재',
      content: '',
      pageRange: '',
      dueDate: new Date().toISOString().slice(0, 10),
      isAbsent: false,
      absentReason: '',
      status: 'completed',
      achievementScore: 100,
      teacherComment: '',
      smsSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  const rawDate = String(a.date || new Date().toISOString().slice(0, 10));

  return {
    id: String(a.id || `asg-${Date.now()}`),
    studentId: String(a.studentId || ''),
    studentName: String(a.studentName || '학생'),
    date: rawDate,
    dayOfWeek: (ALL_DAYS.includes(a.dayOfWeek) ? a.dayOfWeek : '월') as DayOfWeek,
    mode: a.mode === 'exam' ? 'exam' : 'regular',
    teacher: String(a.teacher || '최광민 선생님'),
    bookTitle: String(a.bookTitle || '지정 교재'),
    content: String(a.content || ''),
    pageRange: String(a.pageRange || ''),
    dueDate: String(a.dueDate || rawDate),
    isAbsent: parseBoolean(a.isAbsent),
    absentReason: String(a.absentReason || ''),
    status: parseBoolean(a.isAbsent) ? 'absent' : (a.status || 'completed'),
    achievementScore: Number(a.achievementScore ?? 100),
    teacherComment: String(a.teacherComment || ''),
    smsSent: parseBoolean(a.smsSent),
    smsSentAt: a.smsSentAt ? String(a.smsSentAt) : undefined,
    createdAt: String(a.createdAt || new Date().toISOString()),
    updatedAt: String(a.updatedAt || new Date().toISOString())
  };
};
