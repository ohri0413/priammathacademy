import React, { useState, useEffect, useRef } from 'react';
import { Student, AssignmentRecord, AcademySettings } from '../../types';
import { calculateMonthlySummary, exportReportElementToPdf } from '../../utils/pdfGenerator';
import { copyToClipboard } from '../../utils/smsGenerator';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  User,
  GraduationCap,
  RefreshCw,
  Edit3,
  Check,
  TrendingUp,
  Clock,
  CheckCircle
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
    () => students[0]?.id || ''
  );
  const [customComment, setCustomComment] = useState<Record<string, string>>({});
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  // Sync selected student ID if students list changes or initial id was empty
  useEffect(() => {
    if (students.length > 0) {
      const exists = students.some((s) => s.id === selectedStudentId);
      if (!exists) {
        setSelectedStudentId(students[0].id);
      }
    }
  }, [students, selectedStudentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) ||
    (students.length > 0 ? students[0] : null);

  // Month selector options
  const monthOptions = ['2026-10', '2026-09', '2026-08', '2026-07'];

  if (!selectedStudent) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
        <FileText className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">등록된 학생이 없습니다</h3>
        <p className="text-xs text-slate-500">
          [학생 DB 관리] 메뉴에서 먼저 학생을 등록해주세요.
        </p>
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

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const filename = `${selectedMonth}_${selectedStudent.name}_학업성취도리포트.pdf`;
      const success = await exportReportElementToPdf(reportRef.current, filename);
      if (success) {
        showToast(`📄 ${selectedStudent.name} 학생의 PDF 리포트 다운로드가 완료되었습니다!`);
        onLogActivity(
          'REPORT',
          'PDF 다운로드',
          selectedStudent.regularTeacher,
          `${selectedStudent.name} 학생 ${selectedMonth} 월간 성취도 고해상도 PDF 다운로드`,
          selectedStudent.name
        );
      } else {
        showToast('PDF 생성 중 문제가 발생하여 브라우저 인쇄 모드로 전환합니다.');
        window.print();
      }
    } catch (e) {
      console.error(e);
      showToast('PDF 다운로드 처리 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyReportSms = async () => {
    const [year, month] = selectedMonth.split('-');
    const reportSmsText = `[${settings.academyName} ${year}년 ${month}월 학습 성취도 리포트]
안녕하세요, ${selectedStudent.name} 학부모님.
${selectedStudent.name} 학생의 ${month}월 수학 학습 성취도 보고서를 안내드립니다.

■ 출석률: ${summary.attendanceRate}% (${summary.totalClasses}회 수업 중 ${summary.attendedClasses}회 출석)
■ 과제 수행률: ${summary.assignmentCompletionRate}% (${summary.totalAssignments}회 부여 / ${summary.completedAssignments}회 완료)
■ 평균 성취도: ${summary.averageScore}점

[선생님 종합 학습평]
${activeComment}

상세 학습 리포트 문서는 원에서 별도 발송드렸습니다. 학습 관련 상담이 필요하시면 언제든 연락 부탁드립니다.
- ${settings.academyName} (${settings.academyPhone})`;

    const ok = await copyToClipboard(reportSmsText);
    if (ok) {
      showToast(`📋 ${selectedStudent.name} 학생의 월간 리포트 요약 문자가 복사되었습니다!`);
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
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner (No-print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">학생별 월간 성취도 리포트</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              PDF 출력 &amp; 학부모 전송
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            월별 출석률과 과제 수행률을 정확히 진단하고, 한글 깨짐 없이 깔끔한 고품질 PDF로 즉시 다운로드합니다.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyReportSms}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>리포트 요약문자 복사</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
          >
            {isGeneratingPdf ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>PDF 생성 중...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>PDF 다운로드</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>인쇄 / PDF로 저장</span>
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
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
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
                {s.name} ({s.school} {s.grade} · 담임: {s.regularTeacher})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable / Capturable Report Card Document View */}
      <div
        ref={reportRef}
        id="monthly-report-card"
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto space-y-6 print:p-0 print:border-none print:shadow-none text-slate-900"
        style={{ minWidth: '700px' }}
      >
        {/* Report Card Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-row items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>{settings.academyName} ACADEMIC REPORT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {selectedMonth.replace('-', '년 ')}월 학업 성취도 종합 리포트
            </h2>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono leading-relaxed shrink-0">
            <strong>발행처:</strong> {settings.academyName} ({settings.academyPhone})
            <br />
            <strong>발행일:</strong> {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* Student Profile Info Grid */}
        <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">원생 이름</span>
            <span className="font-black text-slate-900 text-sm">{selectedStudent.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">학교 / 학년</span>
            <span className="font-bold text-slate-800">
              {selectedStudent.school} {selectedStudent.grade}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">정규 수업 담임</span>
            <span className="font-bold text-blue-700">{selectedStudent.regularTeacher}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">수업 요일 / 학부모 번호</span>
            <span className="font-semibold text-slate-700">
              {selectedStudent.classDays.join(', ')}요일 · {selectedStudent.parentPhone}
            </span>
          </div>
        </div>

        {/* 2 Key Metric Highlights: Attendance & Assignment Completion */}
        <div className="grid grid-cols-2 gap-4">
          {/* 1. 출석률 (Attendance Rate Card) */}
          <div className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 p-5 rounded-2xl border-2 border-blue-200 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  출석률 (Attendance)
                </span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  summary.attendanceRate === 100
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : summary.attendanceRate >= 80
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {summary.attendanceRate === 100
                  ? '전회 출석 (개근)'
                  : summary.attendanceRate >= 80
                  ? '출석 양호'
                  : '보충 출석 필요'}
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div className="text-4xl font-black text-blue-700 tracking-tight">
                {summary.attendanceRate}<span className="text-2xl font-bold">%</span>
              </div>
              <div className="text-right text-xs text-slate-600">
                총 <strong className="text-slate-900">{summary.totalClasses}회</strong> 수업 중{' '}
                <strong className="text-blue-700">{summary.attendedClasses}회</strong> 출석
                {summary.absentClasses > 0 && (
                  <span className="text-rose-600 font-bold ml-1">
                    (결석 {summary.absentClasses}회)
                  </span>
                )}
              </div>
            </div>

            {/* Attendance Progress Bar */}
            <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.attendanceRate >= 90
                    ? 'bg-blue-600'
                    : summary.attendanceRate >= 80
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, summary.attendanceRate)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-blue-100">
              <span>출석 횟수: {summary.attendedClasses}회</span>
              <span>결석 횟수: {summary.absentClasses}회</span>
            </div>
          </div>

          {/* 2. 과제 수행률 (Assignment Completion Rate Card) */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 p-5 rounded-2xl border-2 border-emerald-200 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  과제 수행률 (Homework)
                </span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  summary.assignmentCompletionRate >= 90
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : summary.assignmentCompletionRate >= 75
                    ? 'bg-teal-100 text-teal-800 border border-teal-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {summary.assignmentCompletionRate >= 90
                  ? '과제 수행 최우수'
                  : summary.assignmentCompletionRate >= 75
                  ? '과제 수행 양호'
                  : '과제 집중 관리 요망'}
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div className="text-4xl font-black text-emerald-700 tracking-tight">
                {summary.assignmentCompletionRate}<span className="text-2xl font-bold">%</span>
              </div>
              <div className="text-right text-xs text-slate-600">
                총 <strong className="text-slate-900">{summary.totalAssignments}회</strong> 부여 중{' '}
                <strong className="text-emerald-700">{summary.completedAssignments}회</strong> 완료
              </div>
            </div>

            {/* Assignment Progress Bar */}
            <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.assignmentCompletionRate >= 90
                    ? 'bg-emerald-600'
                    : summary.assignmentCompletionRate >= 75
                    ? 'bg-teal-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, summary.assignmentCompletionRate)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-emerald-100">
              <span>완료: {summary.completedAssignments}회</span>
              <span>부분 완료: {summary.partialAssignments}회</span>
              <span>미완료: {summary.incompleteAssignments}회</span>
              <span className="font-bold text-emerald-800">평균: {summary.averageScore}점</span>
            </div>
          </div>
        </div>

        {/* Teacher Comment Card */}
        <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>선생님 월간 종합 학습평 (Teacher Evaluation &amp; Feedback)</span>
            </span>
            <div className="no-print">
              <button
                type="button"
                onClick={() => setIsEditingComment(!isEditingComment)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                {isEditingComment ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>작성 완료</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3" />
                    <span>내용 직접 편집</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isEditingComment ? (
            <textarea
              rows={4}
              value={activeComment}
              onChange={(e) =>
                setCustomComment({
                  ...customComment,
                  [selectedStudent.id]: e.target.value
                })
              }
              className="w-full p-3 text-xs text-slate-800 leading-relaxed border border-blue-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="학부모님께 전달할 총평을 입력하세요."
            />
          ) : (
            <div className="bg-white p-3.5 rounded-xl border border-blue-100 text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
              {activeComment}
            </div>
          )}
        </div>

        {/* Detailed Assignment Records Table */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>월간 수업 및 과제 수행 상세 내역 ({records.length}회차)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              출석률: <strong>{summary.attendanceRate}%</strong> | 과제수행률: <strong>{summary.assignmentCompletionRate}%</strong>
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">수업 일자</th>
                  <th className="px-2 py-2.5">구분</th>
                  <th className="px-3 py-2.5">과제 교재 및 범위</th>
                  <th className="px-3 py-2.5">상세 학습 내용</th>
                  <th className="px-2 py-2.5 text-center">수행 상태</th>
                  <th className="px-2 py-2.5 text-center">성취도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      해당 월에 등록된 수업 및 과제 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-800 font-medium">
                        {r.date} ({r.dayOfWeek})
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.mode === 'exam'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {r.mode === 'exam' ? '내신대비' : '정규'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        {r.bookTitle} {r.pageRange ? `(${r.pageRange})` : ''}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate" title={r.content}>
                        {r.isAbsent ? (
                          <span className="text-rose-600 font-semibold">
                            결석 ({r.absentReason || '사유 미기재'})
                          </span>
                        ) : (
                          r.content || '-'
                        )}
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap text-center">
                        {r.isAbsent ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200">
                            결석
                          </span>
                        ) : r.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                            완료 (100%)
                          </span>
                        ) : r.status === 'partial' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                            일부 미흡
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] border border-slate-300">
                            미완료
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap text-center font-mono font-bold text-slate-800">
                        {r.isAbsent ? '-' : `${r.achievementScore ?? 100}점`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Footer & Certification */}
        <div className="pt-4 border-t border-slate-200 flex flex-row items-center justify-between text-xs text-slate-500">
          <div>
            본 리포트는 <strong>{settings.academyName}</strong> 학원 관리 시스템에서 공식 발행되었습니다.
            <br />
            문의 전화: {settings.academyPhone} | 담임 교사: {selectedStudent.regularTeacher}
          </div>
          <div className="border border-slate-300 rounded-lg px-3 py-1.5 text-center bg-slate-50 shrink-0">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">Official Seal</span>
            <span className="font-bold text-slate-800">{settings.academyName} 검인</span>
          </div>
        </div>
      </div>
    </div>
  );
};
