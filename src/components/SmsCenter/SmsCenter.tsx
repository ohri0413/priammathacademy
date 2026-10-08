import React, { useState } from 'react';
import {
  Student,
  AssignmentRecord,
  AcademySettings,
  AssignmentMode
} from '../../types';
import { getTodayDateString } from '../../utils/storage';
import { generateSmsContent, calculateSmsBytes, copyToClipboard } from '../../utils/smsGenerator';
import {
  MessageSquare,
  Copy,
  Check,
  Calendar,
  Send,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';

interface SmsCenterProps {
  students: Student[];
  assignments: AssignmentRecord[];
  settings: AcademySettings;
  teacherList: string[];
  onUpdateAssignment: (assignment: AssignmentRecord) => void;
  onLogActivity: (category: any, action: string, operator: string, details: string, studentName?: string) => void;
}

export const SmsCenter: React.FC<SmsCenterProps> = ({
  students,
  assignments,
  settings,
  teacherList,
  onUpdateAssignment,
  onLogActivity
}) => {
  const [targetDate, setTargetDate] = useState<string>(getTodayDateString());
  const [selectedTeacher, setSelectedTeacher] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SENT'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter records by date
  const filteredAssignments = assignments.filter((a) => {
    const matchesDate = a.date === targetDate;
    const matchesTeacher = selectedTeacher === 'ALL' || a.teacher === selectedTeacher;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && !a.smsSent) ||
      (statusFilter === 'SENT' && a.smsSent);
    return matchesDate && matchesTeacher && matchesStatus;
  });

  const handleCopy = async (record: AssignmentRecord) => {
    const student = students.find((s) => s.id === record.studentId);
    const content = generateSmsContent(record, student, settings);
    const success = await copyToClipboard(content);

    if (success) {
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);

      if (!record.smsSent) {
        const updated: AssignmentRecord = {
          ...record,
          smsSent: true,
          smsSentAt: new Date().toISOString()
        };
        onUpdateAssignment(updated);
      }

      onLogActivity(
        'SMS',
        '문자 내용 복사',
        record.teacher,
        `${record.studentName} 학생 학부모 문자 복사 완료 (수신번호: ${student?.parentPhone || '미등록'})`,
        record.studentName
      );
    }
  };

  const handleToggleSent = (record: AssignmentRecord) => {
    const nextSent = !record.smsSent;
    const updated: AssignmentRecord = {
      ...record,
      smsSent: nextSent,
      smsSentAt: nextSent ? new Date().toISOString() : undefined
    };
    onUpdateAssignment(updated);

    onLogActivity(
      'SMS',
      nextSent ? '발송 완료 처리' : '발송 대기로 변경',
      record.teacher,
      `${record.studentName} 학생 문자 발송 상태 변경 -> ${nextSent ? '완료' : '대기'}`,
      record.studentName
    );
  };

  const handleCopyAllPending = async () => {
    const pendingList = filteredAssignments.filter((a) => !a.smsSent);
    if (pendingList.length === 0) {
      showToast('발송 대기 중인 문자가 없습니다.');
      return;
    }

    const allTexts = pendingList
      .map((record) => {
        const student = students.find((s) => s.id === record.studentId);
        const text = generateSmsContent(record, student, settings);
        return `[수신: ${record.studentName} 학부모 (${student?.parentPhone})]\n${text}\n----------------------------------------\n`;
      })
      .join('\n');

    const success = await copyToClipboard(allTexts);
    if (success) {
      showToast(`📋 ${pendingList.length}건의 문자가 한번에 클립보드에 복사되었습니다!`);
      // Mark all as sent
      pendingList.forEach((record) => {
        onUpdateAssignment({
          ...record,
          smsSent: true,
          smsSentAt: new Date().toISOString()
        });
      });
      onLogActivity(
        'SMS',
        '대기 문자 일괄 복사',
        '관리자',
        `${pendingList.length}건 대기 문자 일괄 복사 및 발송 완료 처리`
      );
    }
  };

  const totalToday = assignments.filter((a) => a.date === targetDate).length;
  const sentToday = assignments.filter((a) => a.date === targetDate && a.smsSent).length;
  const pendingToday = totalToday - sentToday;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">학부모 알림 문자 발송 센터</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
              대기 {pendingToday}건 / 완료 {sentToday}건
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            담당 선생님별로 등록된 과제 및 결석 알림 문자 내용을 최종 검토하고 바로 복사하여 발송합니다.
          </p>
        </div>

        {/* Date Selector & Batch Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-blue-600" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none focus:outline-none text-slate-800"
            />
          </div>

          <button
            onClick={handleCopyAllPending}
            disabled={pendingToday === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>대기 문자 전체 일괄 복사 ({pendingToday}건)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            선생님:
          </span>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">전체 선생님</option>
            {teacherList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Status Tab buttons */}
        <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-md transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 ({totalToday})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1 rounded-md transition-colors ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            발송 대기 ({pendingToday})
          </button>
          <button
            onClick={() => setStatusFilter('SENT')}
            className={`px-3 py-1 rounded-md transition-colors ${
              statusFilter === 'SENT'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            발송 완료 ({sentToday})
          </button>
        </div>
      </div>

      {/* SMS Messages Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">해당 날짜에 등록된 문자가 없습니다</h3>
          <p className="text-xs text-slate-500 mt-1">
            [과제 입력 & 관리] 메뉴에서 학생들의 과제 또는 결석 여부를 먼저 저장해주세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((record) => {
            const student = students.find((s) => s.id === record.studentId);
            const content = generateSmsContent(record, student, settings);
            const byteCount = calculateSmsBytes(content);
            const isLms = byteCount > 90;
            const isCopied = copiedId === record.id;

            return (
              <div
                key={record.id}
                className={`bg-white rounded-2xl border shadow-xs flex flex-col justify-between overflow-hidden transition-all ${
                  record.smsSent
                    ? 'border-slate-200/70 opacity-90'
                    : 'border-blue-300/80 ring-1 ring-blue-100 shadow-md'
                }`}
              >
                {/* Card Header */}
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{record.studentName}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {student?.school || ''} {student?.grade || ''}
                    </span>
                    {record.isAbsent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                        결석 알림
                      </span>
                    )}
                    {record.mode === 'exam' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        시험대비
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {record.smsSent ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        발송완료
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        대기중
                      </span>
                    )}
                  </div>
                </div>

                {/* Parent contact & Teacher */}
                <div className="px-4 py-2 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono text-slate-700">
                    <Phone className="w-3 h-3 text-blue-500" />
                    {student?.parentPhone || '010-0000-0000'}
                  </span>
                  <span>담당: {record.teacher}</span>
                </div>

                {/* SMS Body Preview */}
                <div className="p-4 flex-1">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {content}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                    <span>
                      용량: <strong className="text-slate-700">{byteCount} Byte</strong>{' '}
                      ({isLms ? 'LMS 장문 문자' : 'SMS 단문'})
                    </span>
                    {record.smsSentAt && (
                      <span>처리: {new Date(record.smsSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleSent(record)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <input
                      type="checkbox"
                      checked={record.smsSent}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>발송 완료 표시</span>
                  </button>

                  <button
                    onClick={() => handleCopy(record)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>문자 내용 복사</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
