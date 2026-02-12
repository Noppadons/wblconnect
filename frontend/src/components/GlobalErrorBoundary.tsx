
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-6">
                    <div className="bg-white p-8 rounded-2xl shadow-elevated border border-border text-center max-w-sm w-full">
                        <div className="w-16 h-16 bg-danger-light text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h1 className="text-xl font-bold text-text-primary mb-2">เกิดข้อผิดพลาด</h1>
                        <p className="text-sm text-text-secondary mb-6">
                            แอปพลิเคชันพบข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary w-full"
                        >
                            <RefreshCcw size={16} />
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
