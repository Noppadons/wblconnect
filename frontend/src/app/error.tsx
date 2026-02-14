"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="card-glass p-10 text-center max-w-sm w-full">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(244,63,94,0.1)",
            border: "1px solid rgba(244,63,94,0.15)",
          }}
        >
          <AlertCircle size={26} strokeWidth={1.5} className="text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-text-primary mb-2">
          เกิดข้อผิดพลาด
        </h1>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          หน้านี้พบข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="btn-primary flex-1 h-11 flex items-center justify-center gap-2"
          >
            <RefreshCcw size={15} />
            ลองใหม่
          </button>
          <a
            href="/"
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-border text-text-secondary hover:bg-surface-hover transition-colors text-sm"
          >
            <Home size={15} />
            หน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}
