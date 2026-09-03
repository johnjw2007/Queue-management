import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function ScoreTrendChart({ data }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
          <YAxis domain={[60, 100]} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              border: 'none',
              color: '#FFF'
            }}
          />
          <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
