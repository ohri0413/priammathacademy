import React, { useState } from 'react';
import { AcademySettings } from '../types';
import {
  X,
  Settings,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Cloud,
  FileCode,
  Copy,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  getGasWebAppUrl,
  setGasWebAppUrl,
  isGasConfigured,
  DEFAULT_SHEET_API_URL,
  SAMPLE_APPS_SCRIPT_CODE
} from '../utils/googleSheetsApi';
import { copyToClipboard } from '../utils/smsGenerator';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AcademySettings;
  teacherList: string[];
  onSaveSettings: (settings: AcademySettings) => void;
  onUpdateTeachers: (teachers: string[]) => void;
  onExportData: () => void;
  onResetData: () => void;
  onSyncWithGoogleSheets?: (targetUrl?: string) => Promise<boolean>;
  onSyncAllToGoogleSheets?: () => Promise<boolean>;
  isSyncing?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  teacherList,
  onSaveSettings,
  onUpdateTeachers,
  onExportData,
  onResetData,
  onSyncWithGoogleSheets,
  onSyncAllToGoogleSheets,
  isSyncing = false
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'templates' | 'teachers' | 'sheets' | 'data'>('sheets');
  const [academyName, setAcademyName] = useState(settings.academyName);
  const [academyPhone, setAcademyPhone] = useState(settings.academyPhone);
  const [regularSmsTemplate, setRegularSmsTemplate] = useState(settings.regularSmsTemplate);
  const [examSmsTemplate, setExamSmsTemplate] = useState(settings.examSmsTemplate);
  const [absentSmsTemplate, setAbsentSmsTemplate] = useState(settings.absentSmsTemplate);

  const [gasUrl, setGasUrl] = useState(getGasWebAppUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncingAllData, setSyncingAllData] = useState(false);

  const [newTeacherName, setNewTeacherName] = useState('');
  const [teachers, setTeachers] = useState<string[]>(teacherList);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
    setGasWebAppUrl(gasUrl);
    onClose();
  };

  const handleSaveGasUrlAndTest = async () => {
    setGasWebAppUrl(gasUrl);
    if (
      !gasUrl.trim() ||
      gasUrl.includes('여기에_복사한') ||
      gasUrl.includes('여기에_구글_웹앱') ||
      !gasUrl.startsWith('https://script.google.com')
    ) {
      setInfoMsg('올바른 구글 앱스 스크립트 웹 앱 URL(https://script.google.com/macros/s/.../exec)을 입력해주세요.');
      setTimeout(() => setInfoMsg(null), 3000);
      return;
    }

    setTestingConnection(true);
    try {
      if (onSyncWithGoogleSheets) {
        const success = await onSyncWithGoogleSheets(gasUrl.trim());
        if (success) {
          setInfoMsg('✅ 구글 스프레드시트와 성공적으로 연결 및 최신 동기화되었습니다!');
        } else {
          setInfoMsg('⚠️ 연결에 실패했습니다. 웹 앱 URL과 배포 권한(액세스 권한: 모든 사용자)을 확인해주세요.');
        }
      }
    } catch (e: any) {
      setInfoMsg(`❌ 연결 오류: ${e?.message || '네트워크 확인 필요'}`);
    } finally {
      setTestingConnection(false);
      setTimeout(() => setInfoMsg(null), 4000);
    }
  };

  const handleSyncAll = async () => {
    if (!onSyncAllToGoogleSheets) return;
    setSyncingAllData(true);
    try {
      const ok = await onSyncAllToGoogleSheets();
      if (ok) {
        setInfoMsg('✅ 구글 스프레드시트에 전체 원생, 과제, 로그, 설정이 성공적으로 생성 및 동기화되었습니다!');
      } else {
        setInfoMsg('⚠️ 전체 동기화 중 오류가 발생했습니다. 웹 앱 URL 및 권한을 확인하세요.');
      }
    } catch (e: any) {
      setInfoMsg(`❌ 동기화 오류: ${e?.message || '네트워크 확인 필요'}`);
    } finally {
      setSyncingAllData(false);
      setTimeout(() => setInfoMsg(null), 4000);
    }
  };

  const handleCopyScriptCode = async () => {
    const success = await copyToClipboard(SAMPLE_APPS_SCRIPT_CODE);
    if (success) {
      setInfoMsg('📋 Apps Script 연동 코드가 복사되었습니다! 구글 시트 Apps Script에 붙여넣으세요.');
      setTimeout(() => setInfoMsg(null), 3500);
    }
  };

  const handleAddTeacher = () => {
    if (!newTeacherName.trim()) return;
    if (teachers.includes(newTeacherName.trim())) {
      setInfoMsg('이미 등록된 선생님입니다.');
      setTimeout(() => setInfoMsg(null), 2500);
      return;
    }
    const updated = [...teachers, newTeacherName.trim()];
    setTeachers(updated);
    setNewTeacherName('');
    setInfoMsg('선생님이 추가되었습니다.');
    setTimeout(() => setInfoMsg(null), 2000);
  };

  const handleDeleteTeacher = (name: string) => {
    if (teachers.length <= 1) {
      setInfoMsg('최소 1명의 선생님이 등록되어 있어야 합니다.');
      setTimeout(() => setInfoMsg(null), 2500);
      return;
    }
    setTeachers(teachers.filter((t) => t !== name));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">학원 설정 & 구글 시트 연동</h2>
              <p className="text-xs text-slate-500">실시간 데이터 연동, 기본 정보, 알림 문자 양식 관리</p>
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
        <div className="flex border-b border-slate-200 px-6 gap-4 text-xs font-semibold text-slate-500 bg-slate-50/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>구글 시트 연동</span>
            {isGasConfigured() && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            문자 템플릿 설정
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            선생님 명단 ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'data'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            데이터 백업/복구
          </button>
        </div>

        {/* Info banner if any */}
        {infoMsg && (
          <div className="mx-6 mt-3 p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">구글 스프레드시트 실시간 연동 (Apps Script API)</h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isGasConfigured()
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {isGasConfigured() ? '연동 활성화됨' : 'URL 설정 필요'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  구글 스프레드시트의 <strong>Apps Script 웹 앱 URL</strong>을 등록하면 모든 학생 DB, 과제 입력 내역, 결석 및 문자 기록이 구글 시트와 <strong>실시간 양방향 동기화</strong>됩니다. 새로고침하거나 다른 기기에서 접속해도 동일한 최신 데이터가 유지됩니다.
                </p>

                {/* URL Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    구글 앱스 스크립트 웹 앱 URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={gasUrl}
                      onChange={(e) => setGasUrl(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveGasUrlAndTest}
                      disabled={testingConnection || isSyncing}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors shrink-0"
                    >
                      {testingConnection || isSyncing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>연결 중...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>연결 & 동기화 테스트</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    💡 코드 상단의 기본 상수(<code>DEFAULT_SHEET_API_URL</code>)에 URL을 입력해두시면, 스마트폰이나 다른 PC에서 첫 접속 시에도 별도 입력 없이 즉시 모든 기기가 자동 연동됩니다. 상단 <strong>[🔄 새로고침]</strong> 버튼 및 35초 주기 자동 새로고침(Auto-refresh)이 지원됩니다.
                  </p>
                </div>

                {/* Full Sync action box */}
                <div className="pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-emerald-900 leading-snug">
                    <strong>구글 시트 처음 연동 시:</strong> 현재 등록된 모든 학생, 과제, 설정을 구글 시트에 즉시 1-Click으로 생성·저장합니다.
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncAll}
                    disabled={syncingAllData || isSyncing || !isGasConfigured()}
                    className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 transition-colors shrink-0"
                  >
                    {syncingAllData ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>전체 내보내는 중...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5" />
                        <span>현재 데이터 전체 시트 생성/내보내기</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step-by-Step Guide for Google Apps Script */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-800">구글 스프레드시트 연동 방법 (간편 4단계)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Apps Script 연동 코드 복사</span>
                  </button>
                </div>

                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>사용하실 <strong>구글 스프레드시트</strong>를 열고 상단 메뉴 <strong>[확장 프로그램] &gt; [Apps Script]</strong>를 클릭합니다.</li>
                  <li>기존 코드를 모두 지우고, 위의 <strong>[Apps Script 연동 코드 복사]</strong> 버튼을 눌러 복사한 코드를 그대로 붙여넣습니다.</li>
                  <li>우측 상단 <strong>[배포] &gt; [새 배포]</strong>를 클릭하고, 유형 톱니바퀴에서 <strong>[웹 앱(Web app)]</strong>을 선택합니다.</li>
                  <li>
                    액세스 권한(Who has access)을 반드시 <strong>&quot;모든 사용자(Anyone)&quot;</strong>로 설정한 후 배포를 완료합니다.
                  </li>
                  <li>완료 화면에 표시된 <strong>&quot;웹 앱 URL&quot;</strong>을 복사하여 위 입력란에 붙여넣고 [연결 &amp; 동기화]를 누르시면 즉시 연동됩니다!</li>
                </ol>
              </div>
            </div>
          )}

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
                <code>{'{content}'}</code>, <code>{'{dueDate}'}</code>,{' '}
                <code>{'{absentReason}'}</code>, <code>{'{academyName}'}</code>, <code>{'{academyPhone}'}</code>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. 정규 수업 과제 문자 양식
                </label>
                <textarea
                  rows={5}
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
                  rows={5}
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
                  rows={5}
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
                  placeholder="예: 최광민 선생님"
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
                {!showResetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="px-4 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>초기 데이터로 리셋</span>
                  </button>
                ) : (
                  <div className="p-3 bg-white border border-rose-300 rounded-xl space-y-2">
                    <p className="text-xs text-rose-800 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      현재 입력된 모든 데이터가 초기화됩니다. 계속하시겠습니까?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetData();
                          setShowResetConfirm(false);
                          setInfoMsg('초기 데이터로 복원되었습니다.');
                          setTimeout(() => {
                            setInfoMsg(null);
                            onClose();
                          }, 1000);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-lg"
                      >
                        네, 초기화합니다
                      </button>
                    </div>
                  </div>
                )}
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
