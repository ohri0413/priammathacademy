import React from 'react';
import {
  Users,
  BookOpen,
  AlertCircle,
  MessageSquare,
  FileText,
  History,
  Settings,
  GraduationCap
} from 'lucide-react';

export type NavTab = 'students' | 'assignments' | 'unchecked' | 'sms' | 'reports' | 'logs';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  uncheckedCount: number;
  pendingSmsCount: number;
  onOpenSettings: () => void;
  academyName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  uncheckedCount,
  pendingSmsCount,
  onOpenSettings,
  academyName
}) => {
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

          {/* Quick Settings & Info */}
          <div className="flex items-center gap-2">
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
