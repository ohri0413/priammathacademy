import React, { useState } from 'react';
import { Student, AssignmentRecord, DayOfWeek, ALL_DAYS } from '../../types';
import { getDayOfWeek, getTodayDateString } from '../../utils/storage';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ArrowRight,
  School,
  Phone,
  Clock,
  UserCheck
} from 'lucide-react';

interface UncheckedAlertsProps {
  students: Student[];
  assignments: AssignmentRecord[];
  teacherList: string[];
  onNavigateToAssignment: (day: DayOfWeek, teacher: string, date: string) => void;
}

export const UncheckedAlerts: React.FC<UncheckedAlertsProps> = ({
  students,
  assignments,
  teacherList,
  onNavigateToAssignment
}) => {
  const [targetDate, setTargetDate] = useState<string>(getTodayDateString());
  const [targetDay, setTargetDay] = useState<DayOfWeek>(getDayOfWeek(getTodayDateString()));

  const handleDateChange = (date: string) => {
    setTargetDate(date);
    setTargetDay(getDayOfWeek(date));
  };

  // Find all students who have class on targetDay
  const scheduledStudents = students.filter((s) => {
    if (!s) return false;
    const days = Array.isArray(s.classDays) ? s.classDays : [];
    return days.includes(targetDay);
  });

  // Determine which ones are checked (have assignment or marked absent on that date)
  const checkedStudentIds = new Set(
    assignments
      .filter((a) => a.date === targetDate)
      .map((a) => a.studentId)
  );

  const uncheckedStudents = scheduledStudents.filter((s) => !checkedStudentIds.has(s.id));
  const checkedStudents = scheduledStudents.filter((s) => checkedStudentIds.has(s.id));

  // Group unchecked by Teacher
  const groupedByTeacher: Record<string, Student[]> = {};
  uncheckedStudents.forEach((s) => {
    const t = s.regularTeacher || '미배정';
    if (!groupedByTeacher[t]) groupedByTeacher[t] = [];
    groupedByTeacher[t].push(s);
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">과제 체크 누락 현황</h1>
            {uncheckedStudents.length > 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                누락 {uncheckedStudents.length}명 주의
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                전원 체크 완료
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            수업 요일 기준으로 아직 과제나 결석 처리가 입력되지 않은 학생을 실시간으로 추적합니다.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-blue-600" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-xs font-medium bg-transparent border-none focus:outline-none text-slate-800"
            />
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
              {targetDay}요일
            </span>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">당일 수업 대상 학생</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{scheduledStudents.length}명</div>
          <span className="text-[11px] text-slate-400">
            {targetDay}요일 정규 수업 편성 원생
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600">체크 완료 (과제/결석)</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{checkedStudents.length}명</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{
                width: `${
                  scheduledStudents.length > 0
                    ? Math.round((checkedStudents.length / scheduledStudents.length) * 100)
                    : 100
                }%`
              }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
          <span className="text-xs font-semibold text-rose-600">과제 미입력 (체크 누락)</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{uncheckedStudents.length}명</div>
          <span className="text-[11px] text-rose-500">
            {uncheckedStudents.length > 0 ? '즉시 입력 또는 결석 처리 필요' : '누락된 학생이 없습니다!'}
          </span>
        </div>
      </div>

      {/* Main Unchecked Students List */}
      {uncheckedStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {targetDate} ({targetDay}요일) 과제 체크가 모두 완료되었습니다!
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            수업에 출석한 모든 학생들의 과제 또는 결석 여부가 빠짐없이 등록되었습니다. 학부모 문자 발송 메뉴에서 알림 문자를 발송하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>선생님별 과제 체크 누락 명단</span>
          </div>

          {Object.entries(groupedByTeacher).map(([teacher, teacherStudents]) => (
            <div
              key={teacher}
              className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{teacher}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                    누락 {teacherStudents.length}명
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToAssignment(targetDay, teacher, targetDate)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  <span>이 선생님 과제 입력 바로가기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {teacherStudents.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center">
                        {s.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {s.school} {s.grade}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                          <span className="font-mono">학부모: {s.parentPhone}</span>
                          <span>수업요일: {s.classDays.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => onNavigateToAssignment(targetDay, teacher, targetDate)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>과제 입력하기</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
