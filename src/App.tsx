import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Student,
  AssignmentRecord,
  ActivityLog,
  AcademySettings,
  DayOfWeek
} from './types';
import {
  loadStudents,
  saveStudents,
  loadAssignments,
  saveAssignments,
  loadLogs,
  saveLogs,
  addActivityLog,
  loadSettings,
  saveSettings,
  loadTeachers,
  saveTeachers,
  exportAllData,
  resetAllData,
  getTodayDateString,
  getDayOfWeek
} from './utils/storage';
import {
  fetchGoogleSheetsData,
  postGoogleSheetsData,
  isGasConfigured,
  setGasWebAppUrl
} from './utils/googleSheetsApi';
import { sanitizeStudent, sanitizeAssignment } from './utils/normalize';
import { Navbar, NavTab } from './components/Navbar';
import { StudentList } from './components/StudentDb/StudentList';
import { StudentModal } from './components/StudentDb/StudentModal';
import { AssignmentManager } from './components/Assignment/AssignmentManager';
import { UncheckedAlerts } from './components/Unchecked/UncheckedAlerts';
import { SmsCenter } from './components/SmsCenter/SmsCenter';
import { MonthlyReportView } from './components/MonthlyReport/MonthlyReportView';
import { ActivityLogView } from './components/Logs/ActivityLogView';
import { SettingsModal } from './components/SettingsModal';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('assignments');

  // Application Data States
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [assignments, setAssignments] = useState<AssignmentRecord[]>(() => loadAssignments());
  const [logs, setLogs] = useState<ActivityLog[]>(() => loadLogs());
  const [settings, setSettings] = useState<AcademySettings>(() => loadSettings());
  const [teachers, setTeachers] = useState<string[]>(() => loadTeachers());

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const isSyncingRef = useRef<boolean>(false);
  const deletedAssignmentIdsRef = useRef<Set<string>>(new Set());
  const deletedStudentIdsRef = useRef<Set<string>>(new Set());

  // Student Modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Settings Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Student Delete Confirmation dialog state (safe for iframes)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
  }>({ isOpen: false, studentId: '', studentName: '' });

  // Sync data from Google Sheets (GET request) with Smart Non-destructive Merge
  const syncFromGoogleSheets = useCallback(
    async (options?: { customUrl?: string; isSilent?: boolean }): Promise<boolean> => {
      if (options?.customUrl) {
        setGasWebAppUrl(options.customUrl);
      }
      if (!isGasConfigured()) {
        return false;
      }

      if (isSyncingRef.current) {
        return false;
      }

      isSyncingRef.current = true;
      setIsSyncing(true);
      if (!options?.isSilent) {
        setSyncStatusText('구글 시트에서 최신 데이터 불러오는 중...');
      }

      try {
        const data = await fetchGoogleSheetsData();
        if (data) {
          // Smart merge students without blowing away recent local edits
          if (Array.isArray(data.students) && data.students.length > 0) {
            const safeStudents = data.students.map(sanitizeStudent);
            setStudents((prev) => {
              const mergedMap = new Map<string, Student>();
              // Keep existing local students first
              prev.forEach((s) => mergedMap.set(s.id, s));

              safeStudents.forEach((remote) => {
                if (deletedStudentIdsRef.current.has(remote.id)) return;
                const local = mergedMap.get(remote.id);
                if (!local) {
                  mergedMap.set(remote.id, remote);
                } else {
                  const rTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
                  const lTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
                  // Only replace if remote is strictly newer
                  if (rTime > lTime) {
                    mergedMap.set(remote.id, remote);
                  }
                }
              });

              const finalStudents = Array.from(mergedMap.values());
              saveStudents(finalStudents);
              return finalStudents;
            });
          }

          // Smart merge assignments: never discard local unsynced or newly entered assignments!
          if (Array.isArray(data.assignments)) {
            const safeAssignments = data.assignments.map(sanitizeAssignment);
            setAssignments((prev) => {
              const mergedMap = new Map<string, AssignmentRecord>();
              // Keep existing local assignments (the source of immediate truth)
              prev.forEach((a) => mergedMap.set(a.id, a));

              safeAssignments.forEach((remote) => {
                // If deleted locally, don't resurrect
                if (deletedAssignmentIdsRef.current.has(remote.id)) return;

                const existingById = mergedMap.get(remote.id);
                const existingBySlot = Array.from(mergedMap.values()).find(
                  (l) => l.studentId === remote.studentId && l.date === remote.date && l.mode === remote.mode
                );
                const local = existingById || existingBySlot;

                if (!local) {
                  // New assignment from sheet/other user
                  mergedMap.set(remote.id, remote);
                } else {
                  const rTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
                  const lTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
                  // Only update if remote is strictly newer than current local
                  if (rTime > lTime) {
                    if (existingBySlot && existingBySlot.id !== remote.id) {
                      mergedMap.delete(existingBySlot.id);
                    }
                    mergedMap.set(remote.id, remote);
                  }
                }
              });

              const finalAssignments = Array.from(mergedMap.values());
              saveAssignments(finalAssignments);
              return finalAssignments;
            });
          }

          if (Array.isArray(data.logs) && data.logs.length > 0) {
            setLogs((prev) => {
              const logIds = new Set(prev.map((l) => l.id));
              const newLogs = data.logs.filter((l) => !logIds.has(l.id));
              const combined = [...prev, ...newLogs].sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              ).slice(0, 500);
              saveLogs(combined);
              return combined;
            });
          }
          if (data.settings && data.settings.academyName) {
            setSettings(data.settings);
            saveSettings(data.settings);
          }
          if (Array.isArray(data.teachers) && data.teachers.length > 0) {
            setTeachers(data.teachers);
            saveTeachers(data.teachers);
          }
          setLastSyncedAt(new Date());
          if (!options?.isSilent) {
            setSyncStatusText('구글 시트 최신 데이터 동기화 완료!');
            setTimeout(() => setSyncStatusText(null), 2500);
          }
          return true;
        }
        return false;
      } catch (err: any) {
        console.warn('Google Sheets sync error:', err);
        if (!options?.isSilent) {
          setSyncStatusText('구글 시트 연결 실패 (오프라인 모드 유지)');
          setTimeout(() => setSyncStatusText(null), 4000);
        }
        return false;
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    []
  );

  // 2. [데이터 자동 새로고침(Polling) 추가]
  // 30초~1분 주기로 백그라운드에서 구글 시트 최신 데이터를 다시 불러오도록(Auto-refresh) 설정
  useEffect(() => {
    // Initial fetch from Google Sheets if configured
    if (isGasConfigured()) {
      syncFromGoogleSheets({ isSilent: false });
    }

    // 35초 주기 백그라운드 자동 동기화 (Polling)
    const intervalId = setInterval(() => {
      if (isGasConfigured() && !isSyncingRef.current) {
        syncFromGoogleSheets({ isSilent: true });
      }
    }, 35000);

    return () => clearInterval(intervalId);
  }, [syncFromGoogleSheets]);

  // Helper for adding activity log
  const handleLogActivity = (
    category: ActivityLog['category'],
    action: string,
    operator: string,
    details: string,
    studentName?: string
  ) => {
    const newLog = addActivityLog(category, action, operator, details, studentName);
    setLogs((prev) => [newLog, ...prev].slice(0, 500));

    // Async background sync for logs
    if (isGasConfigured()) {
      postGoogleSheetsData('saveLog', newLog).catch(() => {});
    }
  };

  // Student DB Handlers
  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (
    studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toISOString();
    let updatedList: Student[];
    let targetStudent: Student;

    if (id) {
      // Edit
      targetStudent = { ...studentData, id, createdAt: now, updatedAt: now };
      updatedList = students.map((s) =>
        s.id === id ? { ...s, ...studentData, updatedAt: now } : s
      );
      handleLogActivity(
        'STUDENT',
        '학생 정보 수정',
        '관리자',
        `${studentData.name} 학생의 정보가 수정되었습니다. (학교: ${studentData.school}, 요일: ${studentData.classDays.join(',')})`,
        studentData.name
      );
    } else {
      // Create
      targetStudent = {
        ...studentData,
        id: `std-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      updatedList = [targetStudent, ...students];
      handleLogActivity(
        'STUDENT',
        '신규 학생 등록',
        '관리자',
        `${studentData.name} (${studentData.school} ${studentData.grade}) 학생 신규 등록됨`,
        studentData.name
      );
    }

    setStudents(updatedList);
    saveStudents(updatedList);

    // Google Sheets POST sync safely in background without blocking or overwriting local state
    if (isGasConfigured()) {
      setIsSyncing(true);
      setSyncStatusText('구글 시트에 학생 정보 동기화 중...');
      postGoogleSheetsData('saveStudent', targetStudent)
        .then(() => {
          setSyncStatusText('구글 시트 학생 저장 완료!');
          setTimeout(() => setSyncStatusText(null), 2500);
        })
        .catch((e) => {
          console.warn('Google Sheets save warning:', e);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  };

  const handleDeleteStudent = (id: string, name: string) => {
    setDeleteDialog({
      isOpen: true,
      studentId: id,
      studentName: name
    });
  };

  const confirmDeleteStudent = async () => {
    const id = deleteDialog.studentId;
    const name = deleteDialog.studentName;
    deletedStudentIdsRef.current.add(id);
    const updatedList = students.filter((s) => s.id !== id);
    setStudents(updatedList);
    saveStudents(updatedList);
    handleLogActivity(
      'STUDENT',
      '학생 삭제',
      '관리자',
      `${name} 학생 DB에서 삭제 처리됨`,
      name
    );
    setDeleteDialog({ isOpen: false, studentId: '', studentName: '' });

    // Google Sheets DELETE sync
    if (isGasConfigured()) {
      setIsSyncing(true);
      setSyncStatusText('구글 시트에서 학생 삭제 중...');
      try {
        await postGoogleSheetsData('deleteStudent', { id });
        setSyncStatusText('구글 시트 삭제 완료!');
        setTimeout(() => setSyncStatusText(null), 2500);
      } catch (e) {
        console.error('Google Sheets delete error:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleQuickChangeExamTeacher = async (studentId: string, newTeacher: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;

    const oldTeacher = target.examTeacher;
    const updatedStudent: Student = {
      ...target,
      examTeacher: newTeacher,
      updatedAt: new Date().toISOString()
    };
    const updatedList = students.map((s) =>
      s.id === studentId ? updatedStudent : s
    );
    setStudents(updatedList);
    saveStudents(updatedList);
    handleLogActivity(
      'STUDENT',
      '시험기간 전담 선생님 변경',
      '관리자',
      `${target.name} 학생의 시험기간 전담 선생님 변경: ${oldTeacher} -> ${newTeacher}`,
      target.name
    );

    // Google Sheets sync
    if (isGasConfigured()) {
      setIsSyncing(true);
      try {
        await postGoogleSheetsData('saveStudent', updatedStudent);
        setSyncStatusText('선생님 정보 시트 반영 완료');
        setTimeout(() => setSyncStatusText(null), 2500);
      } catch (e) {
        console.error('Failed to sync teacher change:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Assignment Handlers
  const handleSaveAssignment = async (record: AssignmentRecord) => {
    // Ensure this assignment is not marked as deleted
    deletedAssignmentIdsRef.current.delete(record.id);

    const exists = assignments.some((a) => a.id === record.id);
    let updated: AssignmentRecord[];

    if (exists) {
      updated = assignments.map((a) => (a.id === record.id ? record : a));
    } else {
      const sameSlotIndex = assignments.findIndex(
        (a) =>
          a.studentId === record.studentId &&
          a.date === record.date &&
          a.mode === record.mode
      );
      if (sameSlotIndex >= 0) {
        updated = [...assignments];
        updated[sameSlotIndex] = record;
      } else {
        updated = [record, ...assignments];
      }
    }

    setAssignments(updated);
    saveAssignments(updated);

    // Google Sheets POST sync: safely save in background without overwriting local state
    if (isGasConfigured()) {
      setIsSyncing(true);
      setSyncStatusText('구글 시트에 과제 저장 중...');
      try {
        await postGoogleSheetsData('saveAssignment', record);
        setSyncStatusText('구글 시트 과제 저장 완료!');
        setTimeout(() => setSyncStatusText(null), 2500);
      } catch (e) {
        console.error('Google Sheets assignment save error:', e);
        setSyncStatusText('로컬 저장 완료 (시트 저장 실패)');
        setTimeout(() => setSyncStatusText(null), 3000);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleDeleteAssignment = async (id: string, studentName: string) => {
    deletedAssignmentIdsRef.current.add(id);
    const updated = assignments.filter((a) => a.id !== id);
    setAssignments(updated);
    saveAssignments(updated);

    // Google Sheets DELETE sync
    if (isGasConfigured()) {
      setIsSyncing(true);
      setSyncStatusText('구글 시트에서 과제 삭제 중...');
      try {
        await postGoogleSheetsData('deleteAssignment', { id });
        setSyncStatusText('구글 시트 과제 삭제 완료!');
        setTimeout(() => setSyncStatusText(null), 2500);
      } catch (e) {
        console.error('Google Sheets assignment delete error:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Settings Handlers
  const handleSaveSettings = async (newSettings: AcademySettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    handleLogActivity('SYSTEM', '학원 설정 수정', '원장/관리자', '학원 정보 및 문자 템플릿 변경');

    if (isGasConfigured()) {
      setIsSyncing(true);
      try {
        await postGoogleSheetsData('saveSettings', { settings: newSettings, teachers });
        setSyncStatusText('구글 시트 설정 저장 완료!');
        setTimeout(() => setSyncStatusText(null), 2500);
      } catch (e) {
        console.error('Google Sheets settings save error:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleUpdateTeachers = async (newTeachers: string[]) => {
    setTeachers(newTeachers);
    saveTeachers(newTeachers);

    if (isGasConfigured()) {
      setIsSyncing(true);
      try {
        await postGoogleSheetsData('saveSettings', { settings, teachers: newTeachers });
        setSyncStatusText('구글 시트 선생님 목록 저장 완료!');
        setTimeout(() => setSyncStatusText(null), 2500);
      } catch (e) {
        console.error('Google Sheets teachers save error:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleSyncAllToGoogleSheets = async (): Promise<boolean> => {
    if (!isGasConfigured()) return false;
    setIsSyncing(true);
    setSyncStatusText('구글 시트에 전체 데이터 동기화 중...');
    try {
      const res = await postGoogleSheetsData('syncAll', {
        students,
        assignments,
        logs,
        settings,
        teachers
      });
      if (res && res.success !== false) {
        setSyncStatusText('구글 시트 전체 동기화 성공!');
        setTimeout(() => setSyncStatusText(null), 3000);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to sync all:', e);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetData = () => {
    resetAllData();
    setStudents(loadStudents());
    setAssignments(loadAssignments());
    setLogs(loadLogs());
    setSettings(loadSettings());
    setTeachers(loadTeachers());
  };

  const handleClearLogs = () => {
    saveLogs([]);
    setLogs([]);
  };

  // Calculate Badges for Navbar
  const todayStr = getTodayDateString();
  const todayDay = getDayOfWeek(todayStr);

  const todayStudents = students.filter((s) => s.classDays.includes(todayDay));
  const checkedTodayIds = new Set(
    assignments.filter((a) => a.date === todayStr).map((a) => a.studentId)
  );
  const uncheckedCount = todayStudents.filter((s) => !checkedTodayIds.has(s.id)).length;

  const pendingSmsCount = assignments.filter(
    (a) => a.date === todayStr && !a.smsSent
  ).length;

  // Navigate directly from Unchecked Alert to Assignment Manager
  const handleNavigateToAssignment = (day: DayOfWeek, teacher: string, date: string) => {
    setActiveTab('assignments');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        uncheckedCount={uncheckedCount}
        pendingSmsCount={pendingSmsCount}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        academyName={settings.academyName}
        isSyncing={isSyncing}
        isGoogleSheetsConnected={isGasConfigured()}
        onManualSync={() => syncFromGoogleSheets({ isSilent: false })}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Real-time Sync Status Toast / Bar */}
      {syncStatusText && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2 text-center flex items-center justify-center gap-2 transition-all">
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{syncStatusText}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'assignments' && (
          <AssignmentManager
            students={students}
            assignments={assignments}
            teacherList={teachers}
            settings={settings}
            onSaveAssignment={handleSaveAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            onLogActivity={handleLogActivity}
          />
        )}

        {activeTab === 'unchecked' && (
          <UncheckedAlerts
            students={students}
            assignments={assignments}
            teacherList={teachers}
            onNavigateToAssignment={handleNavigateToAssignment}
          />
        )}

        {activeTab === 'sms' && (
          <SmsCenter
            students={students}
            assignments={assignments}
            settings={settings}
            teacherList={teachers}
            onUpdateAssignment={handleSaveAssignment}
            onLogActivity={handleLogActivity}
          />
        )}

        {activeTab === 'students' && (
          <StudentList
            students={students}
            teacherList={teachers}
            onAddStudent={handleOpenAddStudent}
            onEditStudent={handleOpenEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onQuickChangeExamTeacher={handleQuickChangeExamTeacher}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            students={students}
            assignments={assignments}
            settings={settings}
            onLogActivity={handleLogActivity}
          />
        )}

        {activeTab === 'logs' && (
          <ActivityLogView logs={logs} onClearLogs={handleClearLogs} />
        )}
      </main>

      {/* Student Add/Edit Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        studentToEdit={studentToEdit}
        teacherList={teachers}
      />

      {/* Student Delete Confirmation Modal (In-app safe modal) */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">학생 정보 삭제</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              정말 <strong>{deleteDialog.studentName}</strong> 학생을 삭제하시겠습니까? 관련된 학생 데이터가 정리됩니다.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDialog({ isOpen: false, studentId: '', studentName: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academy Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        teacherList={teachers}
        onSaveSettings={handleSaveSettings}
        onUpdateTeachers={handleUpdateTeachers}
        onExportData={exportAllData}
        onResetData={handleResetData}
        onSyncWithGoogleSheets={(targetUrl) => syncFromGoogleSheets({ customUrl: targetUrl, isSilent: false })}
        onSyncAllToGoogleSheets={handleSyncAllToGoogleSheets}
        isSyncing={isSyncing}
      />
    </div>
  );
}
