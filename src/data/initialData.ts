import { Student, AssignmentRecord, ActivityLog, AcademySettings, DayOfWeek } from '../types';

export const INITIAL_TEACHERS = [
  '최광민 선생님',
  '박주은 선생님',
  '김동은 선생님',
  '오성민 원장님'
];

export const INITIAL_SETTINGS: AcademySettings = {
  academyName: '프리마 수학학원',
  academyPhone: '02-555-7904',
  regularSmsTemplate: `[프리마 수학학원 과제 알림]
안녕하세요, {studentName} 학부모님.
{date}({dayOfWeek}) {teacher} 수학 수업 과제 안내드립니다.

■ 과제 교재: {bookTitle}
■ 과제 범위: {pageRange}
■ 상세 내용: {content}
■ 제출 기한: {dueDate}까지

우리 아이가 성실히 수학 과제를 완수할 수 있도록 가정에서도 따뜻한 격려와 지도 부탁드립니다.
감사합니다.
- 문의: {academyPhone}`,
  examSmsTemplate: `[프리마 수학학원 내신대비 과제 알림]
안녕하세요, {studentName} 학부모님.
{teacher}의 시험기간 집중 수학 클리닉 과제 안내드립니다.

[내신대비 집중 수학 과제]
■ 대비 교재: {bookTitle}
■ 집중 범위: {pageRange}
■ 핵심 내용: {content}
■ 확인 기한: {dueDate}

수학 내신 1등급을 위해 꼼꼼한 오답 정리 및 취약 유형 복습을 독려해주시기 바랍니다.
- {academyName} 드림 ({academyPhone})`,
  absentSmsTemplate: `[프리마 수학학원 출결 안내]
안녕하세요, {studentName} 학부모님.
금일 {date}({dayOfWeek}) {teacher} 수학 수업에 {studentName} 학생이 결석하여 안내드립니다.

■ 결석 사유: {absentReason}
■ 보충 클리닉 일정 및 진도 과제는 담당 선생님께서 별도 연락드릴 예정입니다.

건강 유의하시고, 문의사항은 언제든 원으로 연락 부탁드립니다.
- {academyName} ({academyPhone})`
};

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    name: '김서연',
    school: '반포중학교',
    grade: '중2',
    studentPhone: '010-3321-4452',
    parentPhone: '010-9988-1122',
    classDays: ['화', '목'],
    regularTeacher: '최광민 선생님',
    examTeacher: '오성민 원장님',
    memo: '이차방정식 개념 보충 필요, 성실함',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z'
  },
  {
    id: 'std-2',
    name: '이준우',
    school: '세화고등학교',
    grade: '고1',
    studentPhone: '010-5412-8974',
    parentPhone: '010-7766-3344',
    classDays: ['화', '목', '토'],
    regularTeacher: '박주은 선생님',
    examTeacher: '오성민 원장님',
    memo: '수학(상) 고난도 킬러 문항 위주 지도 요망',
    createdAt: '2026-09-02T11:00:00Z',
    updatedAt: '2026-10-02T11:00:00Z'
  },
  {
    id: 'std-3',
    name: '박도현',
    school: '서초중학교',
    grade: '중3',
    studentPhone: '010-2345-6789',
    parentPhone: '010-8877-2233',
    classDays: ['화', '금'],
    regularTeacher: '최광민 선생님',
    examTeacher: '박주은 선생님',
    memo: '연산 실수 잦음, 오답노트 필수 점검',
    createdAt: '2026-09-05T14:00:00Z',
    updatedAt: '2026-10-03T12:00:00Z'
  },
  {
    id: 'std-4',
    name: '최예은',
    school: '서문여자고등학교',
    grade: '고2',
    studentPhone: '010-7890-1234',
    parentPhone: '010-6655-4433',
    classDays: ['월', '수', '금'],
    regularTeacher: '김동은 선생님',
    examTeacher: '김동은 선생님',
    memo: '수학I 삼각함수 취약, 그래프 응용 풀이 훈련',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-10-04T15:00:00Z'
  },
  {
    id: 'std-5',
    name: '정민재',
    school: '경원중학교',
    grade: '중2',
    studentPhone: '010-4567-8901',
    parentPhone: '010-3344-5566',
    classDays: ['화', '목'],
    regularTeacher: '김동은 선생님',
    examTeacher: '오성민 원장님',
    memo: '도형의 성질 기초 개념 다지기 진행중',
    createdAt: '2026-09-10T16:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z'
  },
  {
    id: 'std-6',
    name: '강수아',
    school: '상문고등학교',
    grade: '고1',
    studentPhone: '010-6789-0123',
    parentPhone: '010-2233-4455',
    classDays: ['화', '목'],
    regularTeacher: '박주은 선생님',
    examTeacher: '최광민 선생님',
    memo: '수학(하) 함수 단원 기출문제 집중 풀이',
    createdAt: '2026-09-12T13:00:00Z',
    updatedAt: '2026-10-05T11:00:00Z'
  },
  {
    id: 'std-7',
    name: '윤지호',
    school: '원촌중학교',
    grade: '중1',
    studentPhone: '010-8901-2345',
    parentPhone: '010-1122-9988',
    classDays: ['수', '토'],
    regularTeacher: '최광민 선생님',
    examTeacher: '오성민 원장님',
    memo: '일차방정식 활용 서술형 문제 대비',
    createdAt: '2026-09-15T15:00:00Z',
    updatedAt: '2026-10-01T16:00:00Z'
  },
  {
    id: 'std-8',
    name: '한채원',
    school: '서울고등학교',
    grade: '고2',
    studentPhone: '010-9012-3456',
    parentPhone: '010-5544-3322',
    classDays: ['화', '목', '토'],
    regularTeacher: '오성민 원장님',
    examTeacher: '오성민 원장님',
    memo: '수학II 미분 단원 수능/모의고사 심화 킬러 풀이',
    createdAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-10-05T17:00:00Z'
  }
];

export const INITIAL_ASSIGNMENTS: AssignmentRecord[] = [
  {
    id: 'asg-1',
    studentId: 'std-1',
    studentName: '김서연',
    date: '2026-10-06',
    dayOfWeek: '화',
    mode: 'regular',
    teacher: '최광민 선생님',
    bookTitle: '개념원리 RPM 중2-2',
    pageRange: 'p.54 ~ p.58 (유형 01~06)',
    content: '직각삼각형의 합동조건 대표유형 풀이 및 오답노트 작성',
    dueDate: '2026-10-08',
    isAbsent: false,
    status: 'completed',
    smsSent: true,
    smsSentAt: '2026-10-06T18:30:00Z',
    createdAt: '2026-10-06T17:00:00Z',
    updatedAt: '2026-10-06T18:30:00Z'
  },
  {
    id: 'asg-2',
    studentId: 'std-2',
    studentName: '이준우',
    date: '2026-10-06',
    dayOfWeek: '화',
    mode: 'regular',
    teacher: '박주은 선생님',
    bookTitle: '쎈 고등 수학(상)',
    pageRange: 'p.112 ~ p.117 (B, C단계)',
    content: '이차부등식 킬러문제 20문항 풀이 및 해설 비교',
    dueDate: '2026-10-08',
    isAbsent: false,
    status: 'completed',
    smsSent: false,
    createdAt: '2026-10-06T17:10:00Z',
    updatedAt: '2026-10-06T17:10:00Z'
  },
  {
    id: 'asg-3',
    studentId: 'std-3',
    studentName: '박도현',
    date: '2026-10-06',
    dayOfWeek: '화',
    mode: 'regular',
    teacher: '최광민 선생님',
    bookTitle: '체크체크 수학 중3-2',
    pageRange: '-',
    content: '당일 결석으로 과제 미부여 (보충 클리닉 진행 예정)',
    dueDate: '2026-10-09',
    isAbsent: true,
    absentReason: '감기 몸살로 인한 병결',
    status: 'absent',
    smsSent: true,
    smsSentAt: '2026-10-06T16:00:00Z',
    createdAt: '2026-10-06T15:50:00Z',
    updatedAt: '2026-10-06T16:00:00Z'
  },
  {
    id: 'asg-4',
    studentId: 'std-1',
    studentName: '김서연',
    date: '2026-10-02',
    dayOfWeek: '금',
    mode: 'exam',
    teacher: '오성민 원장님',
    bookTitle: '2026 족보닷컴 강남/서초 수학 기출 5개년',
    pageRange: '회차별 모의 1회~2회',
    content: '실전 시간 45분 재고 풀기 및 서술형 배점 체크',
    dueDate: '2026-10-05',
    isAbsent: false,
    status: 'completed',
    smsSent: true,
    smsSentAt: '2026-10-02T19:00:00Z',
    createdAt: '2026-10-02T18:00:00Z',
    updatedAt: '2026-10-02T19:00:00Z'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-06T18:30:00Z',
    category: 'SMS',
    action: '알림 문자 발송 처리',
    operator: '최광민 선생님',
    studentName: '김서연',
    details: '김서연 학부모님(010-9988-1122) 정규 수학 과제 문자 복사 및 발송 완료'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-06T17:10:00Z',
    category: 'ASSIGNMENT',
    action: '과제 등록',
    operator: '박주은 선생님',
    studentName: '이준우',
    details: '쎈 고등 수학(상) p.112~p.117 수학 과제 등록'
  },
  {
    id: 'log-3',
    timestamp: '2026-10-06T15:50:00Z',
    category: 'ATTENDANCE',
    action: '결석 체크',
    operator: '최광민 선생님',
    studentName: '박도현',
    details: '결석 처리: 감기 몸살로 인한 병결 (과제 명단 자동 제외 및 결석 알림 생성)'
  },
  {
    id: 'log-4',
    timestamp: '2026-10-06T14:20:00Z',
    category: 'STUDENT',
    action: '시험기간 전담 선생님 배정',
    operator: '오성민 원장님',
    studentName: '한채원',
    details: '한채원 학생 시험기간 전담 선생님: 오성민 원장님으로 배정'
  }
];
