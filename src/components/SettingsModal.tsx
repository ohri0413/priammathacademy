import React, { useState } from 'react';
import { AcademySettings } from '../types';
import { X, Settings, MessageSquare, Users, Download, Upload, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AcademySettings;
  teacherList: string[];
  onSaveSettings: (settings: AcademySettings) => void;
  onUpdateTeachers: (teachers: string[]) => void;
  onExportData: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  teacherList,
  onSaveSettings,
  onUpdateTeachers,
  onExportData,
  onResetData
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'templates' | 'teachers' | 'data'>('general');
  const [academyName, setAcademyName] = useState(settings.academyName);
  const [academyPhone, setAcademyPhone] = useState(settings.academyPhone);
  const [regularSmsTemplate, setRegularSmsTemplate] = useState(settings.regularSmsTemplate);
  const [examSmsTemplate, setExamSmsTemplate] = useState(settings.examSmsTemplate);
  const [absentSmsTemplate, setAbsentSmsTemplate] = useState(settings.absentSmsTemplate);

  const [newTeacherName, setNewTeacherName] = useState('');
  const [teachers, setTeachers] = useState<string[]>(teacherList);

  if (!isOpen) return null;

  const handleSaveGeneralAndTemplates = () => {
    onSaveSettings({
      academyName,
      academyPhone,
      regularSmsTemplate,
      examSmsTemplate,
      absentSmsTemplate
    });
    onUpdateTeachers(teachers);
    alert('설정이 저장되었습니다.');
    onClose();
  };

  const handleAddTeacher = () => {
    if (!newTeacherName.trim()) return;
    if (teachers.includes(newTeacherName.trim())) {
      alert('이미 등록된 선생님입니다.');
      return;
    }
    const updated = [...teachers, newTeacherName.trim()];
    setTeachers(updated);
    setNewTeacherName('');
  };

  const handleDeleteTeacher = (name: string) => {
    if (teachers.length <= 1) {
      alert('최소 1명의 선생님이 등록되어 있어야 합니다.');
      return;
    }
    setTeachers(teachers.filter((t) => t !== name));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-200 text-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">학원 설정 & 문자 템플릿</h2>
              <p className="text-xs text-slate-500">학원 기본 정보, 알림 문자 양식, 선생님 목록 및 데이터 백업</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 gap-4 text-xs font-semibold text-slate-500 bg-slate-50/30">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            문자 템플릿 설정
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'teachers'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            선생님 명단 ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            데이터 백업/복구
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">학원명</label>
                <input
                  type="text"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">대표 문의 전화번호</label>
                <input
                  type="text"
                  value={academyPhone}
                  onChange={(e) => setAcademyPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-200">
                치환 변수:{' '}
                <code>{'{studentName}'}</code>, <code>{'{date}'}</code>, <code>{'{dayOfWeek}'}</code>,{' '}
                <code>{'{teacher}'}</code>, <code>{'{bookTitle}'}</code>, <code>{'{pageRange}'}</code>,{' '}
                <code>{'{content}'}</code>, <code>{'{dueDate}'}</code>, <code>{'{teacherComment}'}</code>,{' '}
                <code>{'{absentReason}'}</code>, <code>{'{academyName}'}</code>, <code>{'{academyPhone}'}</code>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. 정규 수업 과제 문자 양식
                </label>
                <textarea
                  rows={4}
                  value={regularSmsTemplate}
                  onChange={(e) => setRegularSmsTemplate(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. 시험기간 집중 과제 문자 양식
                </label>
                <textarea
                  rows={4}
                  value={examSmsTemplate}
                  onChange={(e) => setExamSmsTemplate(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. 결석 안내 문자 양식
                </label>
                <textarea
                  rows={4}
                  value={absentSmsTemplate}
                  onChange={(e) => setAbsentSmsTemplate(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="예: 윤재혁 선생님 (수학)"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTeacher}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>추가</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {teachers.map((t) => (
                  <div
                    key={t}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <span className="font-semibold text-slate-800">{t}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeacher(t)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800">데이터 백업 (JSON 다운로드)</h4>
                <p className="text-xs text-slate-500">
                  현재 등록된 모든 원생, 과제 기록, 작업 감사 로그를 컴퓨터 파일로 안전하게 백업합니다.
                </p>
                <button
                  type="button"
                  onClick={onExportData}
                  className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>전체 데이터 다운로드 (.json)</span>
                </button>
              </div>

              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-rose-900">초기 샘플 데이터로 복원</h4>
                <p className="text-xs text-rose-700">
                  처음 제공된 샘플 학생 및 과제 데이터로 리셋합니다.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('정말 초기 샘플 데이터로 리셋하시겠습니까? 현재 입력된 모든 데이터가 대체됩니다.')) {
                      onResetData();
                      alert('초기 데이터로 복원되었습니다.');
                      onClose();
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>초기 데이터로 리셋</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleSaveGeneralAndTemplates}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
          >
            설정 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};
