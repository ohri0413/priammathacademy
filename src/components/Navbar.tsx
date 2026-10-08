import React from 'react';
import {
  Users,
  BookOpen,
  AlertCircle,
  MessageSquare,
  FileText,
  History,
  Settings,
  GraduationCap,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';

export type NavTab = 'students' | 'assignments' | 'unchecked' | 'sms' | 'reports' | 'logs';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  uncheckedCount: number;
  pendingSmsCount: number;
  onOpenSettings: () => void;
  academyName: string;
  isSyncing: boolean;
  isGoogleSheetsConnected: boolean;
  onManualSync: () => void;
  lastSyncedAt?: Date | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  uncheckedCount,
  pendingSmsCount,
  onOpenSettings,
  academyName,
  isSyncing,
  isGoogleSheetsConnected,
  onManualSync,
  lastSyncedAt
}) => {
  // Format last sync time string
  const formatSyncTime = (date?: Date | null): string => {
    if (!date) return '';
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const navItems = [
    {
      id: 'assignments' as NavTab,
      label: '과제 입력 & 관리',
      icon: BookOpen,
      badge: null
    },
    {
      id: 'unchecked' as NavTab,
      label: '과제 체크 누락',
      icon: AlertCircle,
      badge: uncheckedCount > 0 ? uncheckedCount : null,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'sms' as NavTab,
      label: '학부모 문자 발송',
      icon: MessageSquare,
      badge: pendingSmsCount > 0 ? pendingSmsCount : null,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'students' as NavTab,
      label: '학생 DB 관리',
      icon: Users,
      badge: null
    },
    {
      id: 'reports' as NavTab,
      label: '월간 성취도 리포트 (PDF)',
      icon: FileText,
      badge: null
    },
    {
      id: 'logs' as NavTab,
      label: '작업 로그',
      icon: History,
      badge: null
    }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Academy Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 leading-tight">{academyName}</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  수학 전문
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">수학 과제 관리 · 알림 문자 · 성취도 리포트</p>
            </div>
          </div>

          {/* Quick Settings & Google Sheets Sync */}
          <div className="flex items-center gap-2">
            {/* 2. [데이터 자동 새로고침] 눈에 띄는 [🔄 새로고침] 버튼 */}
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer ${
                isGoogleSheetsConnected
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
              title="구글 시트 최신 데이터를 즉시 불러옵니다 (35초 자동 새로고침 작동 중)"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-bold">새로고침</span>
              {lastSyncedAt && (
                <span className="hidden lg:inline text-[11px] font-normal text-blue-100 bg-white/20 px-1.5 py-0.5 rounded-md">
                  {formatSyncTime(lastSyncedAt)}
                </span>
              )}
            </button>

            {/* Google Sheets Status Badge / Button */}
            {isGoogleSheetsConnected ? (
              <button
                onClick={onOpenSettings}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
                title="구글 시트 연동 설정 확인 (자동 동기화 작동 중)"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">시트 연동됨</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>
            ) : (
              <button
                onClick={onOpenSettings}
                className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                title="구글 시트 실시간 연동 설정하기"
              >
                <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">시트 연동</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
              title="학원 설정 및 템플릿"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">학원 설정</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-xs font-bold rounded-full ${
                      isActive ? 'bg-white text-blue-600' : `${item.badgeColor} text-white`
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
