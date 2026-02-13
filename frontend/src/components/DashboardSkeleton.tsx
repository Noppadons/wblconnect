import React from 'react';

export default function DashboardSkeleton({ role }: { role?: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="w-11 h-11 skeleton rounded-2xl mb-4" />
            <div className="h-3 w-24 skeleton mb-2.5" />
            <div className="h-7 w-16 skeleton" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="h-4 w-44 skeleton mb-5" />
        <div className="h-52 skeleton rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6"><div className="h-28 skeleton rounded-xl" /></div>
        <div className="card p-6"><div className="h-28 skeleton rounded-xl" /></div>
      </div>
    </div>
  );
}
