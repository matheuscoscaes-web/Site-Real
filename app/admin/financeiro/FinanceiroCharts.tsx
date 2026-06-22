"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  monthlyData: { label: string; revenue: number; orders: number }[];
  categoryData: { name: string; value: number }[];
}

const COLORS = ["#be185d", "#7c3aed", "#2563eb", "#d97706", "#059669"];

const currencyFormatter = (v: number) => formatCurrency(v);

export function FinanceiroCharts({ monthlyData, categoryData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Faturamento mensal */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-5">Faturamento mensal</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [formatCurrency(v as number), "Receita"]}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              labelStyle={{ fontWeight: "bold", color: "#111827" }}
            />
            <Bar dataKey="revenue" fill="#be185d" radius={[6, 6, 0, 0]} name="Receita" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Categorias */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-5">Vendas por categoria</h2>
        {categoryData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Sem dados ainda</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pedidos por mês */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-5">Pedidos por mês</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
            <Line type="monotone" dataKey="orders" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: "#7c3aed", r: 4 }} name="Pedidos" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
