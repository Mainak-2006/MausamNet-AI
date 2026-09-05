'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { eventTagColor } from '../../lib/format';

export interface EventSlice {
  name: string;
  value: number;
}

export default function EventDistributionChart({ data }: { data: EventSlice[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No report data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, value }) => `${name} (${value})`}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={eventTagColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}