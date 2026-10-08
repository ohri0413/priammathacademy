import React, { useState, useEffect } from 'react';
import {
  Student,
  AssignmentRecord,
  DayOfWeek,
  ALL_DAYS,
  AssignmentMode,
  AcademySettings
} from '../../types';
import { getDayOfWeek, getTodayDateString } from '../../utils/storage';
import { generateSmsContent, copyToClipboard } from '../../utils/smsGenerator';
import { BatchAssignmentModal } from './BatchAssignmentModal';
import {
  Calendar,
  Layers,
  Copy,
  Check,
  Trash2,
  Save,
  UserX,
  AlertTriangle,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface AssignmentManagerProps {
  students: Student[];
  assignments: AssignmentRecord[];
  teacherList: string[];
  settings: AcademySettings;
  onSaveAssignment: (assignment: AssignmentRecord) => void;
  onDeleteAssignment: (id: string, studentName: string) => void;
  onLogActivity: (category: any, action: string, operator: string, details: string, studentName?: string) => void;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  students,
  assignments,
  teacherList,
  settings,
  onSaveAssignment,
  onDeleteAssignment,
  onLogActivity
}) => {
  // Current mode: 'regular' or 'exam'
  const [mode, setMode] = useState<AssignmentMode>('regular');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDayOfWeek(getTodayDateString()));
  const [selectedTeacher, setSelectedTeacher] = useState<string>(teacherList[0] || '');

  // Batch modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // When date changes, automatically sync day of week
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedDay(getDayOfWeek(newDate));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Filter students by selected day and teacher
  const matchingStudents = students.filter((s) => {
    const hasDay = s.classDays.includes(selectedDay);
    const matchesTeacher =
      mode === 'regular'
        ? s.regularTeacher === selectedTeacher
        : s.examTeacher === selectedTeacher;
    return hasDay && matchesTeacher;
  });

  // Local draft state for each student row to allow immediate editing
  const [drafts, setDrafts] = useState<Record<string, Partial<AssignmentRecord>>>({});

  // Sync drafts when matching students, date, or mode changes
  useEffect(() => {
    const newDrafts: Record<string, Partial<AssignmentRecord>> = {};
    matchingStudents.forEach((student) => {
      const existing = assignments.find(
        (a) =>
          a.studentId === student.id &&
          a.date === selectedDate &&
          a.mode === mode
      );

      if (existing) {
        newDrafts[student.id] = { ...existing };
      } else {
        // default template for new assignment
        newDrafts[student.id] = {
          studentId: student.id,
          studentName: student.name,
          date: selectedDate,
          dayOfWeek: selectedDay,
          mode,
          teacher: selectedTeacher,
          bookTitle: '',
          content: '',
          pageRange: '',
          dueDate: selectedDate,
          isAbsent: false,
          absentReason: '',
          status: 'pending',
          achievementScore: 100,
          teacherComment: '성실하게 과제를 완료하여 다음 수업에 임해주세요.',
          smsSent: false
        };
      }
    });
    setDrafts(newDrafts);
  }, [matchingStudents.length, selectedDate, selectedDay, selectedTeacher, mode, assignments]);

  const updateDraft = (studentId: string, field: keyof AssignmentRecord, value: any) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveStudentAssignment = (student: Student) => {
    const draft = drafts[student.id];
    if (!draft) return;

    const recordToSave: AssignmentRecord = {
      id: draft.id || `asg-${Date.now()}-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      date: selectedDate,
      dayOfWeek: selectedDay,
      mode,
      teacher: selectedTeacher,
      bookTitle: draft.isAbsent ? '-' : draft.bookTitle || '기본 교재',
      pageRange: draft.isAbsent ? '-' : draft.pageRange || '',
      content: draft.isAbsent ? '결석으로 인한 과제 미부여' : draft.content || '',
      dueDate: draft.dueDate || selectedDate,
      isAbsent: !!draft.isAbsent,
      absentReason: draft.absentReason || '',
      status: draft.isAbsent ? 'absent' : (draft.status || 'completed'),
      achievementScore: draft.isAbsent ? 0 : Number(draft.achievementScore ?? 100),
      teacherComment: draft.teacherComment || '',
      smsSent: !!draft.smsSent,
      smsSentAt: draft.smsSent ? (draft.smsSentAt || new Date().toISOString()) : undefined,
      createdAt: draft.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveAssignment(recordToSave);
    onLogActivity(
      draft.isAbsent ? 'ATTENDANCE' : 'ASSIGNMENT',
      draft.isAbsent ? '결석 처리' : (draft.id ? '과제 수정' : '과제 등록'),
      selectedTeacher,
      draft.isAbsent
        ? `${student.name} 학생 결석 처리 (${draft.absentReason || '사유 미기재'})`
        : `${student.name} 학생 [${mode === 'exam' ? '시험대비' : '정규'}] ${recordToSave.bookTitle} 과제 저장`,
      student.name
    );

    showToast(`${student.name} 학생의 과제 정보가 저장되었습니다.`);
  };

  const handleDeleteAssignmentRecord = (student: Student) => {
    const existing = assignments.find(
      (a) =>
        a.studentId === student.id &&
        a.date === selectedDate &&
        a.mode === mode
    );
    if (!existing) {
      // Just reset draft
      setDrafts((prev) => ({
        ...prev,
        [student.id]: {
          studentId: student.id,
          studentName: student.name,
          date: selectedDate,
          dayOfWeek: selectedDay,
          mode,
          teacher: selectedTeacher,
          bookTitle: '',
          content: '',
          pageRange: '',
          dueDate: selectedDate,
          isAbsent: false,
          absentReason: '',
          status: 'pending',
          achievementScore: 100,
          teacherComment: '',
          smsSent: false
        }
      }));
      showToast(`${student.name} 학생의 입력 내용이 초기화되었습니다.`);
      return;
    }

    if (confirm(`${student.name} 학생의 ${selectedDate} 과제 기록을 삭제하시겠습니까?`)) {
      onDeleteAssignment(existing.id, student.name);
      onLogActivity(
        'ASSIGNMENT',
        '과제 삭제',
        selectedTeacher,
        `${student.name} 학생의 ${selectedDate} 과제 기록 삭제됨`,
        student.name
      );
      showToast(`${student.name} 학생의 과제 기록이 삭제되었습니다.`);
    }
  };

  const handleCopySms = async (student: Student) => {
    const draft = drafts[student.id];
    if (!draft) return;

    // ensure saved record structure
    const tempRecord: AssignmentRecord = {
      id: draft.id || `asg-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      date: selectedDate,
      dayOfWeek: selectedDay,
      mode,
      teacher: selectedTeacher,
      bookTitle: draft.isAbsent ? '-' : draft.bookTitle || '지정 교재',
      pageRange: draft.pageRange || '',
      content: draft.content || '',
      dueDate: draft.dueDate || selectedDate,
      isAbsent: !!draft.isAbsent,
      absentReason: draft.absentReason || '개인 사유',
      status: draft.status || 'pending',
      achievementScore: draft.achievementScore ?? 100,
      teacherComment: draft.teacherComment || '',
      smsSent: true,
      smsSentAt: new Date().toISOString(),
      createdAt: draft.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const smsText = generateSmsContent(tempRecord, student, settings);
    const copied = await copyToClipboard(smsText);

    if (copied) {
      // Mark as smsSent in draft & save
      updateDraft(student.id, 'smsSent', true);
      updateDraft(student.id, 'smsSentAt', new Date().toISOString());

      // Also persist to store
      onSaveAssignment({
        ...tempRecord,
        smsSent: true,
        smsSentAt: new Date().toISOString()
      });

      onLogActivity(
        'SMS',
        '알림 문자 복사',
        selectedTeacher,
        `${student.name} 학생 학부모(${student.parentPhone}) 문자 내용 클립보드 복사`,
        student.name
      );

      showToast(`📋 ${student.name} 학부모님 발송 문자 복사 완료! 바로 붙여넣기 하세요.`);
    } else {
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  // Batch apply handler
  const handleBatchApply = (batchData: {
    bookTitle: string;
    pageRange: string;
    content: string;
    dueDate: string;
    teacherComment: string;
    studentIds: string[];
  }) => {
    batchData.studentIds.forEach((sid) => {
      const student = students.find((s) => s.id === sid);
      if (!student) return;

      const newRecord: AssignmentRecord = {
        id: `asg-${Date.now()}-${sid}`,
        studentId: sid,
        studentName: student.name,
        date: selectedDate,
        dayOfWeek: selectedDay,
        mode,
        teacher: selectedTeacher,
        bookTitle: batchData.bookTitle,
        pageRange: batchData.pageRange,
        content: batchData.content,
        dueDate: batchData.dueDate,
        isAbsent: false,
        status: 'pending',
        achievementScore: 100,
        teacherComment: batchData.teacherComment,
        smsSent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSaveAssignment(newRecord);
    });

    onLogActivity(
      'ASSIGNMENT',
      '과제 일괄 부여',
      selectedTeacher,
      `${batchData.studentIds.length}명 학생에게 ${batchData.bookTitle} 과제 일괄 적용`
    );

    showToast(`${batchData.studentIds.length}명 학생에게 과제가 일괄 등록되었습니다!`);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mode Switcher Banner (Requirement 8) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">요일별 과제 입력 & 관리</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                mode === 'exam'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
              }`}
            >
              {mode === 'exam' ? '⚡ 시험기간 집중 모드' : '📘 정규 수업 모드'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            요일과 담당 선생님을 선택하면 해당 수업 학생들만 표시되어 과제 입력, 결석 처리 및 학부모 문자를 복사할 수 있습니다.
          </p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
          <button
            onClick={() => setMode('regular')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'regular'
                ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>정규 수업 과제</span>
          </button>
          <button
            onClick={() => setMode('exam')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'exam'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>시험기간 과제</span>
          </button>
        </div>
      </div>

      {/* Date, Day, Teacher Selector Card (Requirement 3) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>수업 날짜 선택</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* 2. Day of Week Buttons */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              수업 요일 선택 <span className="text-slate-400 font-normal">({selectedDay}요일 수업 학생 필터)</span>
            </label>
            <div className="flex gap-1.5">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300 scale-102'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Teacher Selection & Batch Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              {mode === 'regular' ? '정규 담당 선생님:' : '시험기간 전담 선생님:'}
            </span>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-xl font-medium focus:outline-none focus:ring-2 ${
                mode === 'exam'
                  ? 'border-amber-300 bg-amber-50 text-amber-900 focus:ring-amber-500'
                  : 'border-slate-300 bg-white text-slate-800 focus:ring-blue-500'
              }`}
            >
              {teacherList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              disabled={matchingStudents.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>오늘 과제 일괄 등록</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Student Count Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span>
            {selectedDay}요일 수업 · {selectedTeacher}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            총 {matchingStudents.length}명
          </span>
        </div>
        <p className="text-xs text-slate-400">
          결석 체크 시 과제 명단에서 자동 제외되며, 결석 알림 문자가 생성됩니다.
        </p>
      </div>

      {/* Students Assignment Input Cards */}
      {matchingStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">해당 조건의 학생이 없습니다</h3>
          <p className="text-xs text-slate-500 mt-1">
            [{selectedDay}요일]에 [{selectedTeacher}] 수업으로 배정된 학생이 없습니다.
            <br />
            다른 요일이나 선생님을 선택하시거나 [학생 DB 관리]에서 학생의 수업 요일 및 선생님을 확인하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matchingStudents.map((student) => {
            const draft = drafts[student.id] || {};
            const isAbsent = !!draft.isAbsent;
            const hasSaved = !!draft.id;

            return (
              <div
                key={student.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isAbsent
                    ? 'border-rose-200 bg-rose-50/20'
                    : hasSaved
                    ? 'border-slate-200/90 shadow-xs'
                    : 'border-blue-200/90 ring-1 ring-blue-100'
                }`}
              >
                {/* Student Row Header */}
                <div
                  className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                    isAbsent
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {student.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{student.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                          {student.school} {student.grade}
                        </span>
                        {isAbsent ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                            결석 (과제 제외)
                          </span>
                        ) : hasSaved ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            과제 저장됨
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            과제 미입력
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        학부모: <span className="font-mono text-slate-700">{student.parentPhone}</span>
                        {student.memo && <span className="ml-2 text-slate-400">| 메모: {student.memo}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Absent Check Button (Requirement 6) */}
                  <div className="flex items-center gap-2">
                    <label
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                        isAbsent
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAbsent}
                        onChange={(e) => updateDraft(student.id, 'isAbsent', e.target.checked)}
                        className="sr-only"
                      />
                      <UserX className="w-3.5 h-3.5" />
                      <span>{isAbsent ? '결석 취소' : '결석 체크'}</span>
                    </label>
                  </div>
                </div>

                {/* Assignment Input Body */}
                <div className="p-5">
                  {isAbsent ? (
                    /* Absent Notice Panel (Requirement 6: 결석한 학생들은 과제 명단에서 자동 제외) */
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>결석 처리된 학생입니다 (과제 부여 목록에서 제외됨)</span>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-rose-900 mb-1">
                          결석 사유 (학부모 알림 문자에 자동 반영)
                        </label>
                        <input
                          type="text"
                          value={draft.absentReason || ''}
                          onChange={(e) => updateDraft(student.id, 'absentReason', e.target.value)}
                          placeholder="예: 감기 몸살로 인한 병결, 학교 행사 참석 등"
                          className="w-full px-3 py-2 text-sm border border-rose-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <p className="text-xs text-rose-600">
                        * 결석 학생에게는 과제 대신 '결석 안내 및 보충 일정 알림 문자'가 생성됩니다.
                      </p>
                    </div>
                  ) : (
                    /* Regular / Exam Assignment Input Form */
                    <div className="space-y-3.5">
                      {/* Row 1: Book & Range */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            과제 교재명 / 단원 <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={draft.bookTitle || ''}
                            onChange={(e) => updateDraft(student.id, 'bookTitle', e.target.value)}
                            placeholder="예: 쎈 수학(상) / 3단원 이차함수"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            과제 범위
                          </label>
                          <input
                            type="text"
                            value={draft.pageRange || ''}
                            onChange={(e) => updateDraft(student.id, 'pageRange', e.target.value)}
                            placeholder="예: p.72~p.78 (유형 01~08)"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Row 2: Assignment Detailed Content */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          과제 상세 내용 및 지시사항
                        </label>
                        <textarea
                          rows={2}
                          value={draft.content || ''}
                          onChange={(e) => updateDraft(student.id, 'content', e.target.value)}
                          placeholder="예: 홀수번 위주 풀이, 틀린 문제 오답노트에 풀이과정 정확히 적어오기"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Row 3: Due date, Status, Score */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            제출 마감일
                          </label>
                          <input
                            type="date"
                            value={draft.dueDate || selectedDate}
                            onChange={(e) => updateDraft(student.id, 'dueDate', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            과제 수행 상태
                          </label>
                          <select
                            value={draft.status || 'pending'}
                            onChange={(e) => updateDraft(student.id, 'status', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="pending">진행 중 (과제 부여)</option>
                            <option value="completed">완료 (100% 이행)</option>
                            <option value="partial">일부 완료 (보충 필요)</option>
                            <option value="incomplete">미완료 (미제출)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            성취도 점수 (100점 만점)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={draft.achievementScore ?? 100}
                            onChange={(e) =>
                              updateDraft(student.id, 'achievementScore', Number(e.target.value))
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Row 4: Teacher Comment for parents */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          선생님 코멘트 (학부모 알림 문자에 포함)
                        </label>
                        <input
                          type="text"
                          value={draft.teacherComment || ''}
                          onChange={(e) => updateDraft(student.id, 'teacherComment', e.target.value)}
                          placeholder="예: 개념 이해도가 우수합니다. 서술형 풀이 과정을 신경 써주세요."
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Bottom Row Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
                    {/* Sent status toggle */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!draft.smsSent}
                          onChange={(e) => updateDraft(student.id, 'smsSent', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span>학부모 문자 발송 완료</span>
                      </label>
                      {draft.smsSent && (
                        <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          발송됨
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteAssignmentRecord(student)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                        title="과제 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">삭제</span>
                      </button>

                      {/* 1-Click Copy SMS Button (Requirement 4) */}
                      <button
                        onClick={() => handleCopySms(student)}
                        className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>학부모 문자 복사</span>
                      </button>

                      {/* Save Button */}
                      <button
                        onClick={() => handleSaveStudentAssignment(student)}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>과제 저장</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Assignment Modal */}
      <BatchAssignmentModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        targetStudents={matchingStudents}
        onApply={handleBatchApply}
        defaultDueDate={selectedDate}
      />
    </div>
  );
};
