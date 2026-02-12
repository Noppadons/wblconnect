import React from 'react';

export default function DashboardSkeleton({ role }: { role?: string }) {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="w-10 h-10 bg-slate-100 rounded-lg mb-3" />
            <div className="h-3 w-20 bg-slate-100 rounded mb-2" />
            <div className="h-6 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="h-4 w-40 bg-slate-100 rounded mb-4" />
        <div className="h-48 bg-slate-50 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6 h-32" />
        <div className="card p-6 h-32" />
      </div>
    </div>
  );
}
