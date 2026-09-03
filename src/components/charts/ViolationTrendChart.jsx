import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function ViolationTrendChart({ data }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              border: 'none',
              color: '#FFF',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
            }}
          />
          <Bar dataKey="violations" name="Violations" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={36} />
          <Bar dataKey="resolved" name="Resolved" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
