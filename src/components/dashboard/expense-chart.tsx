'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo } from 'react';
import type { DashboardData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

interface ExpenseChartProps {
  data: DashboardData;
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  const chartData = useMemo(() => {
    const costsByCategory: { [key: string]: number } = {};

    data.categories.forEach(cat => {
        costsByCategory[cat.name] = 0;
    });

    data.vehicleServices.forEach(vs => {
      const vehicle = data.vehicles.find(v => v.id === vs.vehicleId);
      if (vehicle && vs.cost) {
        const category = data.categories.find(c => c.id === vehicle.category);
        if (category) {
          costsByCategory[category.name] = (costsByCategory[category.name] || 0) + vs.cost;
        }
      }
    });

    data.correctiveServices.forEach(cs => {
        const vehicle = data.vehicles.find(v => v.id === cs.vehicleId);
        if (vehicle && cs.cost) {
            const category = data.categories.find(c => c.id === vehicle.category);
            if (category) {
                costsByCategory[category.name] = (costsByCategory[category.name] || 0) + cs.cost;
            }
        }
    });

    return Object.entries(costsByCategory).map(([name, total]) => ({
      name,
      total,
    })).sort((a,b) => b.total - a.total);

  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Custo total de manutenções por categoria de veículo.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
             <Tooltip 
                cursor={{fill: 'hsl(var(--muted))'}}
                contentStyle={{background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
