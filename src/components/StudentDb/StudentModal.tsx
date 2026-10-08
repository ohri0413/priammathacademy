import React, { useState, useEffect } from 'react';
import { Student, DayOfWeek, ALL_DAYS } from '../../types';
import { X, User, Phone, School, Calendar, BookOpen, ShieldAlert } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  studentToEdit?: Student | null;
  teacherList: string[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentToEdit,
  teacherList
}) => {
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('중2');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [classDays, setClassDays] = useState<DayOfWeek[]>(['월', '수']);
  const [regularTeacher, setRegularTeacher] = useState('');
  const [examTeacher, setExamTeacher] = useState('');
  const [memo, setMemo] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gradeOptions = ['초등', '중1', '중2', '중3', '고1', '고2', '고3', 'N수생'];

  useEffect(() => {
    if (!isOpen) return;
    if (studentToEdit) {
      setName(studentToEdit.name);
      setSchool(studentToEdit.school);
      setGrade(studentToEdit.grade);
      setStudentPhone(studentToEdit.studentPhone);
      setParentPhone(studentToEdit.parentPhone);
      setClassDays(studentToEdit.classDays || []);
      setRegularTeacher(studentToEdit.regularTeacher || teacherList[0] || '');
      setExamTeacher(studentToEdit.examTeacher || teacherList[0] || '');
      setMemo(studentToEdit.memo || '');
    } else {
      setName('');
      setSchool('');
      setGrade('중2');
      setStudentPhone('');
      setParentPhone('');
      setClassDays(['화', '목']);
      setRegularTeacher(teacherList[0] || '');
      setExamTeacher(teacherList[0] || '');
      setMemo('');
    }
  }, [studentToEdit, isOpen, teacherList]);

  if (!isOpen) return null;

  const toggleDay = (day: DayOfWeek) => {
    if (classDays.includes(day)) {
      setClassDays(classDays.filter((d) => d !== day));
    } else {
      setClassDays([...classDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('학생 이름을 입력해주세요.');
      return;
    }
    if (classDays.length === 0) {
      setErrorMsg('최소 1개 이상의 수업 요일을 선택해주세요.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      onSave(
        {
          name: name.trim(),
          school: school.trim() || '미지정',
          grade,
          studentPhone: studentPhone.trim() || '010-0000-0000',
          parentPhone: parentPhone.trim() || '010-0000-0000',
          classDays,
          regularTeacher: regularTeacher || teacherList[0] || '미배정',
          examTeacher: examTeacher || regularTeacher || teacherList[0] || '미배정',
          memo: memo.trim()
        },
        studentToEdit?.id
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {studentToEdit ? '학생 정보 수정' : '신규 학생 등록'}
              </h2>
              <p className="text-xs text-slate-500">학생 기본 정보, 연락처, 수업 요일 및 전담 선생님 설정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span className="font-semibold">입력 오류:</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {/* Row 1: Name, School, Grade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                이름 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 김민서"
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">학교</label>
              <div className="relative">
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="예: 서초중학교"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <School className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">학년</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학부모 연락처 (문자 발송용) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  required
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Phone className="w-4 h-4 text-blue-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">학생 연락처</label>
              <div className="relative">
                <input
                  type="text"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Row 3: Class Days Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>수업 요일 선택 (다중 선택 가능)</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = classDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs scale-105 ring-2 ring-blue-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-1">선택된 요일: {classDays.join(', ') || '없음'}</p>
          </div>

          {/* Row 4: Teachers assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>정규 수업 담당 선생님</span>
              </label>
              <select
                value={regularTeacher}
                onChange={(e) => setRegularTeacher(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {teacherList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>시험기간 전담 선생님 (내신대비)</span>
              </label>
              <select
                value={examTeacher}
                onChange={(e) => setExamTeacher(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-amber-300 bg-amber-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {teacherList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-amber-700 block mt-0.5">
                시험기간 모드 시 이 선생님 기준으로 과제가 배정됩니다.
              </span>
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">학습 특이사항 / 메모</label>
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 취약 단원, 성향, 보충 이력 등"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Live Preview Section (실시간 등록 정보 & 문자 미리보기) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-blue-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                실시간 학생 정보 미리보기 (Live Preview)
              </span>
              <span className="text-[11px] text-blue-600 font-medium">입력 즉시 반영</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-blue-700">{name.trim() || '(이름 입력 대기)'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal text-[11px]">
                    {school.trim() || '학교'} · {grade}
                  </span>
                </div>
                <span className="font-mono text-slate-600">{parentPhone.trim() || '학부모 연락처'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                <span className="font-semibold text-slate-700">수업 요일:</span>
                {classDays.length > 0 ? (
                  classDays.map((d) => (
                    <span key={d} className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="text-rose-500 font-bold">선택 필요</span>
                )}
                <span className="mx-1 text-slate-300">|</span>
                <span>정규: <strong className="text-slate-700">{regularTeacher || '미지정'}</strong></span>
                <span className="mx-1 text-slate-300">|</span>
                <span>시험대비: <strong className="text-amber-700">{examTeacher || '미지정'}</strong></span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>저장 중...</span>
                </>
              ) : (
                <span>{studentToEdit ? '수정 완료' : '학생 등록'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
