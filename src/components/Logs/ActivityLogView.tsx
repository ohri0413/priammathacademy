import React, { useState } from 'react';
import { ActivityLog } from '../../types';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  Calendar,
  User,
  CheckCircle,
  Clock
} from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.studentName && log.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (cat: ActivityLog['category']) => {
    switch (cat) {
      case 'STUDENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">학생 DB</span>;
      case 'ASSIGNMENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">과제 입력</span>;
      case 'ATTENDANCE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">출결/결석</span>;
      case 'SMS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">알림 문자</span>;
      case 'REPORT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">성취도 리포트</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">시스템</span>;
    }
  };

  const exportLogsAsCsv = () => {
    if (filteredLogs.length === 0) {
      alert('내보낼 로그가 없습니다.');
      return;
    }
    const headers = ['일시', '카테고리', '작업', '작업자', '대상 학생', '상세 내용'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString('ko-KR')}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.operator}"`,
      `"${l.studentName || '-'}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `academy_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">작업 감사 로그 관리</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              총 {logs.length}건
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            학생 정보 변경, 과제 등록/수정/삭제, 결석 처리 및 문자 발송 내역이 안전하게 기록됩니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLogsAsCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 다운로드</span>
          </button>
          <button
            onClick={() => {
              if (confirm('모든 작업 기록을 초기화하시겠습니까?')) {
                onClearLogs();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>로그 비우기</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="작업 내용, 선생님, 학생 이름 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {['ALL', 'STUDENT', 'ASSIGNMENT', 'ATTENDANCE', 'SMS', 'REPORT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' && '전체'}
              {cat === 'STUDENT' && '학생 DB'}
              {cat === 'ASSIGNMENT' && '과제'}
              {cat === 'ATTENDANCE' && '출결'}
              {cat === 'SMS' && '문자'}
              {cat === 'REPORT' && '리포트'}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">시간</th>
                <th className="px-3 py-3.5">카테고리</th>
                <th className="px-3 py-3.5">작업 구분</th>
                <th className="px-3 py-3.5">작업자</th>
                <th className="px-3 py-3.5">대상 학생</th>
                <th className="px-4 py-3.5">상세 내용</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm">기록된 작업 로그가 없습니다.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logDate = new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors text-xs">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono">
                        {logDate.toLocaleDateString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit'
                        })}{' '}
                        {logDate.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{getCategoryBadge(log.category)}</td>
                      <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-800">
                        {log.action}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-700">{log.operator}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {log.studentName ? (
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {log.studentName}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-md">{log.details}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
