"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AnalyticsData = {
  day: string;
  views: number;
};

type AnalyticsChartProps = {
  data: AnalyticsData[];
};

export default function AnalyticsChart({
  data,
}: AnalyticsChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            stroke="#71717a"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#71717a"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "12px",
              color: "#ffffff",
            }}
            labelStyle={{
              color: "#a1a1aa",
            }}
          />

          <Line
            type="monotone"
            dataKey="views"
            stroke="#ffffff"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}