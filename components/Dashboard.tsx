import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { ServiceRecord, PaymentMethod } from '../types';
import { formatCurrency, getMonthName } from '../utils/formatters';
import { TrendingUp, Banknote, CreditCard, Landmark } from 'lucide-react';

interface DashboardProps {
  records: ServiceRecord[];
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  
  const stats = useMemo(() => {
    let totalGeneral = 0;
    const byMethod: Record<string, number> = {
      [PaymentMethod.PIX]: 0,
      [PaymentMethod.DINHEIRO]: 0,
      [PaymentMethod.DEBITO]: 0,
      [PaymentMethod.CREDITO]: 0,
    };
    
    // Monthly aggregation
    const monthlyData: Record<string, number> = {};
    const monthlyCount: Record<string, number> = {};

    records.forEach(record => {
      // Only count completed records with an amount
      if (record.status !== 'concluido' || record.amount === undefined || record.paymentMethod === undefined) {
        return;
      }

      totalGeneral += record.amount;
      
      if (byMethod[record.paymentMethod] !== undefined) {
        byMethod[record.paymentMethod] += record.amount;
      }

      const monthKey = record.serviceDate.substring(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + record.amount;
      monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
    });

    const pieData = Object.entries(byMethod)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    const barData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({
        name: getMonthName(date),
        rawDate: date,
        value,
        count: monthlyCount[date] || 0
      }));

    return { totalGeneral, byMethod, pieData, barData };
  }, [records]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Geral</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalGeneral)}</h3>
          </div>
          <div className="p-3 bg-indigo-50 rounded-full">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Pix</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.byMethod[PaymentMethod.PIX])}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full">
            <Landmark className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Dinheiro</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.byMethod[PaymentMethod.DINHEIRO])}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-full">
            <Banknote className="w-6 h-6 text-green-600" />
          </div>
        </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Cartão (D/C)</p>
            <h3 className="text-2xl font-bold text-slate-800">
                {formatCurrency(stats.byMethod[PaymentMethod.DEBITO] + stats.byMethod[PaymentMethod.CREDITO])}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-full">
            <CreditCard className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Faturamento Mensal</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    tick={{fontSize: 12}} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <YAxis 
                    tickFormatter={(value) => `R$${value}`} 
                    tick={{fontSize: 12}} 
                    tickLine={false} 
                    axisLine={false}
                />
                <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg outline-none">
                                    <p className="font-semibold text-slate-800 mb-2">{label}</p>
                                    <div className="space-y-1">
                                        <p className="text-sm text-indigo-600 font-medium flex justify-between gap-4">
                                            <span>Faturamento:</span>
                                            <span>{formatCurrency(data.value)}</span>
                                        </p>
                                        <p className="text-sm text-slate-600 font-medium flex justify-between gap-4">
                                            <span>Atendimentos:</span>
                                            <span>{data.count}</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Por Forma de Pagamento</h3>
          <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;