import React, { useState } from 'react';
import { X, Layers, CheckSquare, AlertCircle } from 'lucide-react';
import { Student } from '../../types';

interface BatchAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudents: Student[];
  onApply: (data: {
    bookTitle: string;
    pageRange: string;
    content: string;
    dueDate: string;
    studentIds: string[];
  }) => void;
  defaultDueDate: string;
}

export const BatchAssignmentModal: React.FC<BatchAssignmentModalProps> = ({
  isOpen,
  onClose,
  targetStudents,
  onApply,
  defaultDueDate
}) => {
  const [bookTitle, setBookTitle] = useState('');
  const [pageRange, setPageRange] = useState('');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    targetStudents.map((s) => s.id)
  );

  if (!isOpen) return null;

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === targetStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(targetStudents.map((s) => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) {
      setErrorMsg('교재명을 입력해주세요.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setErrorMsg('과제를 적용할 학생을 1명 이상 선택해주세요.');
      return;
    }
    setErrorMsg(null);
    onApply({
      bookTitle: bookTitle.trim(),
      pageRange: pageRange.trim(),
      content: content.trim(),
      dueDate,
      studentIds: selectedStudentIds
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">과제 일괄 입력</h2>
              <p className="text-xs text-slate-500">선택한 학생들에게 동일한 교재 및 과제를 일괄 부여합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Student Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>적용 대상 학생 ({selectedStudentIds.length}/{targetStudents.length}명)</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {selectedStudentIds.length === targetStudents.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
              {targetStudents.map((s) => {
                const isChecked = selectedStudentIds.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      isChecked
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-80">({s.grade})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                교재명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="예: 쎈 수학(상), 개념원리 RPM"
                value={bookTitle}
                onChange={(e) => {
                  setBookTitle(e.target.value);
                  setErrorMsg(null);
                }}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">과제 범위</label>
              <input
                type="text"
                placeholder="예: p.45 ~ p.52 또는 01~25번"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">과제 상세 내용</label>
            <textarea
              rows={2}
              placeholder="예: 유형별 홀수번 풀이 및 오답노트 작성"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">제출 마감일</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              일괄 부여하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
