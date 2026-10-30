"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, BarChart3, Calendar } from "lucide-react";

interface DailyPoint {
  date: string;
  responses: number;
}

interface FormTopPoint {
  title: string;
  count: number;
}

interface OverviewChartsProps {
  dailyData7: DailyPoint[];
  dailyData30: DailyPoint[];
  dailyData90: DailyPoint[];
  topForms: FormTopPoint[];
}

export function OverviewCharts({
  dailyData7,
  dailyData30,
  dailyData90,
  topForms,
}: OverviewChartsProps) {
  const [period, setPeriod] = useState<"7" | "30" | "90">("7");

  const currentDailyData =
    period === "7" ? dailyData7 : period === "30" ? dailyData30 : dailyData90;

  const totalPeriodResponses = currentDailyData.reduce(
    (acc, cur) => acc + cur.responses,
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Response Evolution Area Chart */}
      <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                Evolução de Respostas
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {totalPeriodResponses} resposta(s) registradas no período selecionado
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setPeriod("7")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === "7"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => setPeriod("30")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === "30"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => setPeriod("90")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === "90"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              90 dias
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={currentDailyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-800"
              />
              <XAxis
                dataKey="date"
                stroke="currentColor"
                className="text-zinc-400 dark:text-zinc-500 text-[11px]"
                tickLine={false}
              />
              <YAxis
                stroke="currentColor"
                className="text-zinc-400 dark:text-zinc-500 text-[11px]"
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f4f4f5",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                }}
              />
              <Area
                type="monotone"
                dataKey="responses"
                name="Respostas"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorResponses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Forms Bar Chart */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
              Formulários Mais Acessados
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Volume total de envios por formulário
          </p>

          {topForms.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4 text-zinc-400">
              <Calendar className="w-8 h-8 stroke-1 mb-2 text-zinc-500" />
              <p className="text-xs">Nenhuma resposta registrada ainda</p>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topForms}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="currentColor"
                    className="text-zinc-200 dark:text-zinc-800"
                  />
                  <XAxis
                    type="number"
                    stroke="currentColor"
                    className="text-zinc-400 dark:text-zinc-500 text-[11px]"
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    stroke="currentColor"
                    className="text-zinc-400 dark:text-zinc-500 text-[11px]"
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#f4f4f5",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Respostas"
                    fill="#818cf8"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400 flex justify-between items-center">
          <span>Ranking em tempo real</span>
          <span className="text-indigo-500 font-medium">Atualizado</span>
        </div>
      </div>
    </div>
  );
}
