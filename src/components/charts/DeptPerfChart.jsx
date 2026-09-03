import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

export function DeptPerfChart({ data }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar name="Queue Discipline Score" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.5} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              border: 'none',
              color: '#FFF'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
