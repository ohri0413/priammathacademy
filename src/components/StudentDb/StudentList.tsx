import React, { useState } from 'react';
import { Student, DayOfWeek, ALL_DAYS } from '../../types';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  School,
  Calendar,
  Filter,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface StudentListProps {
  students: Student[];
  teacherList: string[];
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string, name: string) => void;
  onQuickChangeExamTeacher: (studentId: string, newTeacher: string) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  teacherList,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onQuickChangeExamTeacher
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<DayOfWeek | 'ALL'>('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ALL');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentPhone.includes(searchTerm) ||
      s.studentPhone.includes(searchTerm);

    const matchesDay = selectedDayFilter === 'ALL' || s.classDays.includes(selectedDayFilter);
    const matchesGrade = selectedGradeFilter === 'ALL' || s.grade === selectedGradeFilter;
    const matchesTeacher =
      selectedTeacherFilter === 'ALL' ||
      s.regularTeacher === selectedTeacherFilter ||
      s.examTeacher === selectedTeacherFilter;

    return matchesSearch && matchesDay && matchesGrade && matchesTeacher;
  });

  const allGrades = Array.from(new Set(students.map((s) => s.grade))).sort();

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>학생 DB 관리</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
              총 {students.length}명
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            원생 정보, 수업 요일, 정규 담당 및 시험기간 전담 선생님을 등록·수정·관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddStudent}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>신규 학생 등록</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="이름, 학교, 연락처 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Grade filter */}
          <div>
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">전체 학년</option>
              {allGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher filter */}
          <div>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">전체 담당 선생님</option>
              {teacherList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDayFilter('ALL');
                setSelectedGradeFilter('ALL');
                setSelectedTeacherFilter('ALL');
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 w-full"
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* Day of Week Filter Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            수업 요일:
          </span>
          <button
            onClick={() => setSelectedDayFilter('ALL')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              selectedDayFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 요일
          </button>
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                selectedDayFilter === day
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {day}요일
            </button>
          ))}
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">학생 / 학교</th>
                <th className="px-3 py-3.5">학년</th>
                <th className="px-3 py-3.5">학부모 연락처</th>
                <th className="px-3 py-3.5">수업 요일</th>
                <th className="px-4 py-3.5">정규 담당</th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1 text-amber-700">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>시험기간 전담</span>
                  </div>
                </th>
                <th className="px-3 py-3.5">메모</th>
                <th className="px-3 py-3.5 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm">조건에 일치하는 학생이 없습니다.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student name & School */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                        {student.name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <School className="w-3 h-3 text-slate-400" />
                        <span>{student.school}</span>
                      </div>
                    </td>

                    {/* Grade */}
                    <td className="px-3 py-3.5">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {student.grade}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-3 py-3.5">
                      <div className="text-xs text-slate-800 font-mono flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        <span>{student.parentPhone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono pl-4.5">
                        학생: {student.studentPhone}
                      </div>
                    </td>

                    {/* Class Days */}
                    <td className="px-3 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {student.classDays.map((d) => (
                          <span
                            key={d}
                            className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Regular Teacher */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md block w-fit">
                        {student.regularTeacher}
                      </span>
                    </td>

                    {/* Exam Teacher Quick Select */}
                    <td className="px-4 py-3.5">
                      <select
                        value={student.examTeacher}
                        onChange={(e) => onQuickChangeExamTeacher(student.id, e.target.value)}
                        className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        title="시험기간 전담 선생님 바로 변경"
                      >
                        {teacherList.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Memo */}
                    <td className="px-3 py-3.5 max-w-[160px]">
                      <p className="text-xs text-slate-500 truncate" title={student.memo}>
                        {student.memo || '-'}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="학생 정보 수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteStudent(student.id, student.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="학생 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
