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

const CURRENT_VERSION = 'prima_math_v3';

// In-memory fallback if localStorage is blocked by iframe sandboxes or security settings
const memoryFallback: Record<string, string> = {};

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Access denied or sandboxed
    }
    return memoryFallback[key] ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Access denied or sandboxed
    }
    memoryFallback[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Access denied or sandboxed
    }
    delete memoryFallback[key];
  }
};

// Automatic migration check to ensure '프리마 수학학원' and 4 teachers are always active
const checkAndMigrate = () => {
  try {
    const version = safeStorage.getItem(STORAGE_KEYS.VERSION);
    const existingSettings = safeStorage.getItem(STORAGE_KEYS.SETTINGS);

    // If version is outdated or contains old academy name or old templates
    if (
      version !== CURRENT_VERSION ||
      (existingSettings && existingSettings.includes('플러스인재학원')) ||
      (existingSettings && existingSettings.includes('선생님 코멘트: {teacherComment}'))
    ) {
      safeStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
      safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      safeStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      safeStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      safeStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
      safeStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    }
  } catch (e) {
    console.warn('Safe migration fallback:', e);
  }
};

// Run checkAndMigrate safely
try {
  checkAndMigrate();
} catch (e) {
  console.warn('Initial storage check bypassed:', e);
}

export const getDayOfWeek = (dateStr: string): DayOfWeek => {
  try {
    const date = new Date(dateStr);
    const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday ...
    const map: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];
    return map[dayIndex] || '월';
  } catch {
    return '월';
  }
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
    const raw = safeStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load students, using initial data:', e);
    return INITIAL_STUDENTS;
  }
};

export const saveStudents = (students: Student[]): void => {
  try {
    safeStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.warn('Failed to save students:', e);
  }
};

export const loadAssignments = (): AssignmentRecord[] => {
  try {
    checkAndMigrate();
    const raw = safeStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
      return INITIAL_ASSIGNMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load assignments, using initial data:', e);
    return INITIAL_ASSIGNMENTS;
  }
};

export const saveAssignments = (assignments: AssignmentRecord[]): void => {
  try {
    safeStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  } catch (e) {
    console.warn('Failed to save assignments:', e);
  }
};

export const loadLogs = (): ActivityLog[] => {
  try {
    checkAndMigrate();
    const raw = safeStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load logs, using initial data:', e);
    return INITIAL_LOGS;
  }
};

export const saveLogs = (logs: ActivityLog[]): void => {
  try {
    safeStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.warn('Failed to save logs:', e);
  }
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
    const raw = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    if (parsed.academyName === '플러스인재학원') {
      safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return parsed;
  } catch (e) {
    console.warn('Failed to load settings, using initial data:', e);
    return INITIAL_SETTINGS;
  }
};

export const saveSettings = (settings: AcademySettings): void => {
  try {
    safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
};

export const loadTeachers = (): string[] => {
  try {
    checkAndMigrate();
    const raw = safeStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      return INITIAL_TEACHERS;
    }
    const parsed: string[] = JSON.parse(raw);
    if (parsed.some((t) => t.includes('영어') || t.includes('국어') || t.includes('과학'))) {
      safeStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      return INITIAL_TEACHERS;
    }
    return parsed;
  } catch (e) {
    console.warn('Failed to load teachers, using initial data:', e);
    return INITIAL_TEACHERS;
  }
};

export const saveTeachers = (teachers: string[]): void => {
  try {
    safeStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  } catch (e) {
    console.warn('Failed to save teachers:', e);
  }
};

export const exportAllData = () => {
  const data = {
    version: '3.0',
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
  safeStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  safeStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
  safeStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  safeStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
};
