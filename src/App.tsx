import React, { useState, useEffect } from 'react';
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
import { Navbar, NavTab } from './components/Navbar';
import { StudentList } from './components/StudentDb/StudentList';
import { StudentModal } from './components/StudentDb/StudentModal';
import { AssignmentManager } from './components/Assignment/AssignmentManager';
import { UncheckedAlerts } from './components/Unchecked/UncheckedAlerts';
import { SmsCenter } from './components/SmsCenter/SmsCenter';
import { MonthlyReportView } from './components/MonthlyReport/MonthlyReportView';
import { ActivityLogView } from './components/Logs/ActivityLogView';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('assignments');

  // Application Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AcademySettings>(loadSettings());
  const [teachers, setTeachers] = useState<string[]>([]);

  // Student Modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Settings Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    setStudents(loadStudents());
    setAssignments(loadAssignments());
    setLogs(loadLogs());
    setSettings(loadSettings());
    setTeachers(loadTeachers());
  }, []);

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

  const handleSaveStudent = (
    studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toISOString();
    let updatedList: Student[];

    if (id) {
      // Edit
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
      const newStudent: Student = {
        ...studentData,
        id: `std-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      updatedList = [newStudent, ...students];
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
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`정말 ${name} 학생을 삭제하시겠습니까? 관련 학생 데이터가 정리됩니다.`)) {
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
    }
  };

  const handleQuickChangeExamTeacher = (studentId: string, newTeacher: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;

    const oldTeacher = target.examTeacher;
    const updatedList = students.map((s) =>
      s.id === studentId
        ? { ...s, examTeacher: newTeacher, updatedAt: new Date().toISOString() }
        : s
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
  };

  // Assignment Handlers
  const handleSaveAssignment = (record: AssignmentRecord) => {
    const exists = assignments.some((a) => a.id === record.id);
    let updated: AssignmentRecord[];

    if (exists) {
      updated = assignments.map((a) => (a.id === record.id ? record : a));
    } else {
      // also check if there is an existing record for the same student, date, and mode
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
  };

  const handleDeleteAssignment = (id: string, studentName: string) => {
    const updated = assignments.filter((a) => a.id !== id);
    setAssignments(updated);
    saveAssignments(updated);
  };

  // Settings Handlers
  const handleSaveSettings = (newSettings: AcademySettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    handleLogActivity('SYSTEM', '학원 설정 수정', '원장/관리자', '학원 정보 및 문자 템플릿 변경');
  };

  const handleUpdateTeachers = (newTeachers: string[]) => {
    setTeachers(newTeachers);
    saveTeachers(newTeachers);
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
      />

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
      />
    </div>
  );
}
