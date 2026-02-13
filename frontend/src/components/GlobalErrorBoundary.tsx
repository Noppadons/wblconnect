
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
                <div className="min-h-screen flex items-center justify-center p-6 bg-background gradient-mesh">
                    <div className="card-glass p-10 text-center max-w-sm w-full">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                             style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.15)' }}>
                            <AlertCircle size={26} strokeWidth={1.5} className="text-danger" />
                        </div>
                        <h1 className="text-[18px] font-bold text-text-primary mb-2 tracking-tight">เกิดข้อผิดพลาด</h1>
                        <p className="text-[14px] text-text-secondary mb-8 leading-relaxed">
                            แอปพลิเคชันพบข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary w-full h-12"
                        >
                            <RefreshCcw size={15} />
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
