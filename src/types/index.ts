export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

export const ALL_DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

export type AssignmentMode = 'regular' | 'exam';

export type AssignmentStatus = 'completed' | 'partial' | 'incomplete' | 'pending' | 'absent';

export interface Student {
  id: string;
  name: string;
  school: string;
  grade: string;
  studentPhone: string;
  parentPhone: string;
  classDays: DayOfWeek[];
  regularTeacher: string;
  examTeacher: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  mode: AssignmentMode;
  teacher: string;
  bookTitle: string; // 교재명
  content: string; // 과제 상세 내용
  pageRange: string; // 페이지 또는 번호 범위
  dueDate: string; // 마감일 (YYYY-MM-DD)
  isAbsent: boolean; // 결석 여부
  absentReason?: string; // 결석 사유
  status: AssignmentStatus;
  achievementScore?: number; // 성취도 (0-100)
  teacherComment?: string; // 선생님 코멘트
  smsSent: boolean; // 문자 발송 완료 여부
  smsSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  category: 'STUDENT' | 'ASSIGNMENT' | 'ATTENDANCE' | 'SMS' | 'REPORT' | 'SYSTEM';
  action: string;
  operator: string;
  studentName?: string;
  details: string;
}

export interface AcademySettings {
  academyName: string;
  academyPhone: string;
  regularSmsTemplate: string;
  examSmsTemplate: string;
  absentSmsTemplate: string;
}

export interface MonthlyAchievementSummary {
  studentId: string;
  studentName: string;
  school: string;
  grade: string;
  yearMonth: string; // YYYY-MM
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  attendanceRate: number; // %
  totalAssignments: number;
  completedAssignments: number;
  partialAssignments: number;
  incompleteAssignments: number;
  assignmentCompletionRate: number; // %
  averageScore: number;
  teacherComment: string;
}
