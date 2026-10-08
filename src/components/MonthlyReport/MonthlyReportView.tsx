import React, { useState } from 'react';
import { Student, AssignmentRecord, AcademySettings } from '../../types';
import { calculateMonthlySummary, exportMonthlyReportToPdf } from '../../utils/pdfGenerator';
import { copyToClipboard } from '../../utils/smsGenerator';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Award,
  BookOpen,
  User,
  GraduationCap
} from 'lucide-react';

interface MonthlyReportViewProps {
  students: Student[];
  assignments: AssignmentRecord[];
  settings: AcademySettings;
  onLogActivity: (category: any, action: string, operator: string, details: string, studentName?: string) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  students,
  assignments,
  settings,
  onLogActivity
}) => {
  const currentMonthStr = '2026-10';
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [customComment, setCustomComment] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Month selector options
  const monthOptions = ['2026-10', '2026-09', '2026-08', '2026-07'];

  if (!selectedStudent) {
    return (
      <div className="bg-white p-8 rounded-2xl border text-center text-slate-500">
        등록된 학생이 없습니다.
      </div>
    );
  }

  const { summary, records } = calculateMonthlySummary(
    selectedStudent,
    assignments,
    selectedMonth
  );

  const activeComment =
    customComment[selectedStudent.id] !== undefined
      ? customComment[selectedStudent.id]
      : summary.teacherComment;

  const handlePrint = () => {
    onLogActivity(
      'REPORT',
      '월간 리포트 인쇄',
      selectedStudent.regularTeacher,
      `${selectedStudent.name} 학생 ${selectedMonth} 성취도 리포트 인쇄/PDF 저장 창 실행`,
      selectedStudent.name
    );
    window.print();
  };

  const handleDownloadPdf = () => {
    const updatedSummary = {
      ...summary,
      teacherComment: activeComment
    };
    exportMonthlyReportToPdf(selectedStudent, updatedSummary, records, settings);
    onLogActivity(
      'REPORT',
      'PDF 다운로드',
      selectedStudent.regularTeacher,
      `${selectedStudent.name} 학생 ${selectedMonth} 월간 성취도 PDF 리포트 파일 다운로드`,
      selectedStudent.name
    );
  };

  const handleCopyReportSms = async () => {
    const [year, month] = selectedMonth.split('-');
    const reportSmsText = `[${settings.academyName} ${year}년 ${month}월 성취도 리포트]
안녕하세요, ${selectedStudent.name} 학부모님.
${selectedStudent.name} 학생의 이번 달 학습 성취도 보고서를 안내드립니다.

■ 출석률: ${summary.attendanceRate}% (${summary.totalClasses}회 중 ${summary.attendedClasses}회 출석)
■ 과제 수행률: ${summary.assignmentCompletionRate}% (${summary.totalAssignments}회 부여 / ${summary.completedAssignments}회 완료)
■ 평균 성취도: ${summary.averageScore}점

[선생님 종합 총평]
${activeComment}

상세 학습 리포트 파일은 원에서 별도 발송드렸습니다. 언제든 상담이 필요하시면 원으로 연락 부탁드립니다.
- ${settings.academyName} (${settings.academyPhone})`;

    const ok = await copyToClipboard(reportSmsText);
    if (ok) {
      showToast(`📋 ${selectedStudent.name} 학생의 월간 리포트 안내 문자가 복사되었습니다!`);
      onLogActivity(
        'SMS',
        '월간 리포트 문자 복사',
        selectedStudent.regularTeacher,
        `${selectedStudent.name} 학생 ${selectedMonth} 월간 성취도 문자 복사`,
        selectedStudent.name
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Top Banner (No-print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">학생별 월간 성취도 리포트</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
              PDF 출력 & 학부모 전송
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            월별 과제 이행률, 출석률, 세부 과제 평가 내역을 종합하여 학부모 전송용 리포트를 발행합니다.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyReportSms}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>리포트 요약문자 복사</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF 다운로드</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>인쇄 / PDF 저장</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar (No-print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Month Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            조회 월:
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m.replace('-', '년 ')}월
              </option>
            ))}
          </select>
        </div>

        {/* Student Selector */}
        <div className="flex items-center gap-2 w-full sm:flex-1">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-blue-600" />
            대상 학생:
          </span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.school} {s.grade} · {s.regularTeacher})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable Report Card Document View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Report Card Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm tracking-wider uppercase mb-1">
              <GraduationCap className="w-5 h-5" />
              <span>{settings.academyName} ACADEMIC REPORT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {selectedMonth.replace('-', '년 ')}월 학업 성취도 종합 리포트
            </h2>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            발행처: {settings.academyName} ({settings.academyPhone})
            <br />
            발행일: {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* Student Profile Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">원생 이름</span>
            <span className="font-bold text-slate-900 text-sm">{selectedStudent.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">학교 / 학년</span>
            <span className="font-semibold text-slate-800">
              {selectedStudent.school} {selectedStudent.grade}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">정규 담당 선생님</span>
            <span className="font-semibold text-slate-800">{selectedStudent.regularTeacher}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">시험기간 전담</span>
            <span className="font-semibold text-amber-800">{selectedStudent.examTeacher}</span>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Metric 1: Attendance */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-4 rounded-2xl border border-blue-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">출석률</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 font-bold">
                {summary.attendanceRate}%
              </span>
            </div>
            <div className="text-3xl font-black text-blue-700 my-2">
              {summary.attendedClasses} <span className="text-sm font-normal text-slate-500">/ {summary.totalClasses}회</span>
            </div>
            <div className="w-full bg-blue-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${summary.attendanceRate}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-2">
              출석 {summary.attendedClasses}회 · 결석 {summary.absentClasses}회
            </span>
          </div>

          {/* Metric 2: Assignment Completion */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">과제 수행률</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold">
                {summary.assignmentCompletionRate}%
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-700 my-2">
              {summary.completedAssignments}{' '}
              <span className="text-sm font-normal text-slate-500">/ {summary.totalAssignments}회</span>
            </div>
            <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${summary.assignmentCompletionRate}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-2">
              완료 {summary.completedAssignments}회 · 부분 {summary.partialAssignments}회 · 미완료{' '}
              {summary.incompleteAssignments}회
            </span>
          </div>

          {/* Metric 3: Average Score */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 rounded-2xl border border-amber-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">평균 성취도</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-700 my-2">
              {summary.averageScore} <span className="text-sm font-normal text-slate-500">점</span>
            </div>
            <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${summary.averageScore}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-2">
              과제 완성도 및 단원 이해도 종합
            </span>
          </div>
        </div>

        {/* Teacher Comment Box */}
        <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>선생님 월간 종합 학습평</span>
            </span>
            <span className="no-print text-[11px] text-slate-400">
              * 내용을 직접 수정할 수 있습니다.
            </span>
          </div>
          <textarea
            rows={3}
            value={activeComment}
            onChange={(e) =>
              setCustomComment({
                ...customComment,
                [selectedStudent.id]: e.target.value
              })
            }
            className="w-full p-3 text-xs text-slate-800 leading-relaxed border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Detailed Assignment Records Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>월간 수업 및 과제 이행 상세 내역 ({records.length}건)</span>
          </h3>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">수업 일자</th>
                  <th className="px-2 py-2.5">구분</th>
                  <th className="px-3 py-2.5">과제 교재 및 범위</th>
                  <th className="px-3 py-2.5">상세 내용</th>
                  <th className="px-2 py-2.5">상태</th>
                  <th className="px-2 py-2.5">점수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      해당 월에 기록된 수업/과제 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-700">
                        {r.date} ({r.dayOfWeek})
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.mode === 'exam'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {r.mode === 'exam' ? '내신대비' : '정규'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {r.bookTitle} {r.pageRange ? `(${r.pageRange})` : ''}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate" title={r.content}>
                        {r.content}
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        {r.isAbsent ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[11px]">
                            결석
                          </span>
                        ) : r.status === 'completed' ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            완료
                          </span>
                        ) : r.status === 'partial' ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
                            일부
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[11px]">
                            미완료
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap font-mono font-bold text-slate-800">
                        {r.isAbsent ? '-' : `${r.achievementScore ?? 0}점`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Footer */}
        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
          본 리포트는 {settings.academyName} 학원 관리 시스템에서 공식 발행되었습니다. 학부모님의 관심과 격려에 항상 감사드립니다.
        </div>
      </div>
    </div>
  );
};
