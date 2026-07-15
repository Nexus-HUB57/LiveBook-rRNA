"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] Caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-[#1a1a1b] flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">&#x26A0;&#xFE0F;</div>
              <h1 className="text-white text-2xl font-bold mb-2">Runtime Error</h1>
              <p className="text-[#888] text-sm">Something went wrong. The page has been recovered.</p>
            </div>
            <div className="bg-[#272729] rounded-xl border border-[#e01b24]/30 p-4 mb-6">
              <p className="text-[#e01b24] text-xs font-mono break-all">{this.state.error?.message || "Unknown error"}</p>
              {this.state.error?.stack && (
                <pre className="text-[#555] text-[10px] font-mono mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {this.state.error.stack.split("\n").slice(0, 15).join("\n")}
                </pre>
              )}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full bg-[#e01b24] hover:bg-[#ff3b3b] text-white font-medium py-3 rounded-xl transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}