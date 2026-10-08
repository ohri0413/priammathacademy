import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { resetAllData } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    resetAllData();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-xl space-y-5 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">화면을 불러오는 중 오류가 발생했습니다</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                입력된 데이터 형식 문제로 인해 화면이 일시적으로 중단되었습니다. 아래 버튼을 눌러 복구할 수 있습니다.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-100 text-slate-700 text-xs font-mono rounded-xl text-left max-h-32 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>새로고침하여 다시 시도</span>
              </button>
              <button
                onClick={this.handleReset}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>초기 데이터 복원</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
