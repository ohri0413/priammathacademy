import { Student, AssignmentRecord, ActivityLog, AcademySettings, DayOfWeek } from '../types';
import { INITIAL_STUDENTS, INITIAL_ASSIGNMENTS, INITIAL_LOGS, INITIAL_SETTINGS, INITIAL_TEACHERS } from '../data/initialData';

const STORAGE_KEYS = {
  VERSION: 'primamath_version',
  STUDENTS: 'edumanager_students',
  ASSIGNMENTS: 'edumanager_assignments',
  LOGS: 'edumanager_logs',
  SETTINGS: 'edumanager_settings',
  TEACHERS: 'edumanager_teachers'
};

const CURRENT_VERSION = 'prima_math_v2';

// Automatic migration check to ensure '프리마 수학학원' and the 4 teachers are loaded
const checkAndMigrate = () => {
  try {
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);
    const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    // If version is outdated or academy is still old name, reseed or migrate
    if (version !== CURRENT_VERSION || (existingSettings && existingSettings.includes('플러스인재학원'))) {
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    }
  } catch (e) {
    console.error('Migration error:', e);
  }
};

checkAndMigrate();

export const getDayOfWeek = (dateStr: string): DayOfWeek => {
  const date = new Date(dateStr);
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday ...
  const map: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];
  return map[dayIndex] || '월';
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const loadStudents = (): Student[] => {
  try {
    checkAndMigrate();
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load students:', e);
    return INITIAL_STUDENTS;
  }
};

export const saveStudents = (students: Student[]): void => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const loadAssignments = (): AssignmentRecord[] => {
  try {
    checkAndMigrate();
    const raw = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
      return INITIAL_ASSIGNMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load assignments:', e);
    return INITIAL_ASSIGNMENTS;
  }
};

export const saveAssignments = (assignments: AssignmentRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
};

export const loadLogs = (): ActivityLog[] => {
  try {
    checkAndMigrate();
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load logs:', e);
    return INITIAL_LOGS;
  }
};

export const saveLogs = (logs: ActivityLog[]): void => {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
};

export const addActivityLog = (
  category: ActivityLog['category'],
  action: string,
  operator: string,
  details: string,
  studentName?: string
): ActivityLog => {
  const current = loadLogs();
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    category,
    action,
    operator,
    studentName,
    details
  };
  const updated = [newLog, ...current].slice(0, 500); // keep up to 500 logs
  saveLogs(updated);
  return newLog;
};

export const loadSettings = (): AcademySettings => {
  try {
    checkAndMigrate();
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    if (parsed.academyName === '플러스인재학원') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return INITIAL_SETTINGS;
  }
};

export const saveSettings = (settings: AcademySettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const loadTeachers = (): string[] => {
  try {
    checkAndMigrate();
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      return INITIAL_TEACHERS;
    }
    const parsed: string[] = JSON.parse(raw);
    // If contains old dummy teachers, overwrite with new teachers
    if (parsed.some((t) => t.includes('영어') || t.includes('국어') || t.includes('과학'))) {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      return INITIAL_TEACHERS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load teachers:', e);
    return INITIAL_TEACHERS;
  }
};

export const saveTeachers = (teachers: string[]): void => {
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
};

export const exportAllData = () => {
  const data = {
    version: '2.0',
    academy: '프리마 수학학원',
    exportDate: new Date().toISOString(),
    students: loadStudents(),
    assignments: loadAssignments(),
    logs: loadLogs(),
    settings: loadSettings(),
    teachers: loadTeachers()
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `primamath_backup_${getTodayDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const resetAllData = () => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
};
