"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartDataPoint = {
  label: string;
  fullLabel: string;
  paid: number;
  pending: number;
};

interface AdminSalesChartProps {
  data: ChartDataPoint[];
  view: "daily" | "monthly" | "yearly";
  isRevenue?: boolean;
}

const formatYAxis = (value: number, isRevenue: boolean) => {
  if (!isRevenue) return String(value);
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

export default function AdminSalesChart({ data, view, isRevenue = false }: AdminSalesChartProps) {
  return (
    <div className="w-full" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          barCategoryGap={view === "yearly" ? "40%" : view === "monthly" ? "30%" : "20%"}
          barGap={2}
        >
          <defs>
            <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.85} />
            </linearGradient>
            <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={isRevenue ? 52 : 36}
            tickFormatter={(v) => formatYAxis(v as number, isRevenue)}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9", radius: 6 }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontSize: 12,
              padding: "8px 14px",
            }}
            labelFormatter={(label) => {
              const item = data.find((d) => d.label === label);
              return item?.fullLabel ?? label;
            }}
            formatter={(value, name) => [
              isRevenue ? `Rp ${Number(value).toLocaleString("id-ID")}` : String(value),
              name === "paid" ? "Paid / Issued" : "Pending",
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) => (value === "paid" ? "Paid / Issued" : "Pending")}
          />
          <Bar
            dataKey="paid"
            stackId="a"
            fill="url(#gradPaid)"
            radius={[0, 0, 4, 4] as unknown as number}
            maxBarSize={56}
            isAnimationActive
          >
            {data.map((_entry, index) => (
              <Cell key={`paid-${index}`} />
            ))}
          </Bar>
          <Bar
            dataKey="pending"
            stackId="a"
            fill="url(#gradPending)"
            radius={[6, 6, 0, 0]}
            maxBarSize={56}
            isAnimationActive
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
