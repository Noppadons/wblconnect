"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Student page error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-6 min-h-[60vh]">
      <div className="card-glass p-8 text-center max-w-sm w-full">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "rgba(244,63,94,0.1)",
            border: "1px solid rgba(244,63,94,0.15)",
          }}
        >
          <AlertCircle size={22} strokeWidth={1.5} className="text-red-500" />
        </div>
        <h2 className="text-base font-bold text-text-primary mb-1">
          เกิดข้อผิดพลาด
        </h2>
        <p className="text-sm text-text-secondary mb-5">
          ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="btn-primary flex-1 h-10 flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCcw size={14} />
            ลองใหม่
          </button>
          <a
            href="/student/profile"
            className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border border-border text-text-secondary hover:bg-surface-hover transition-colors text-sm"
          >
            <ArrowLeft size={14} />
            โปรไฟล์
          </a>
        </div>
      </div>
    </div>
  );
}
