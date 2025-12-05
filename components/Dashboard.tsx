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
import { TrendingUp, Banknote, CreditCard, Landmark, Wallet } from 'lucide-react';
import { AppSettings } from './SettingsModal';

interface DashboardProps {
  records: ServiceRecord[];
  settings?: AppSettings;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ records, settings }) => {
  
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

      // Cálculo do valor líquido se houver taxa
      let liquidAmount = record.amount;
      
      // Aplicar taxas apenas para contabilidade do total geral e cards, se configurado
      // Para o gráfico mensal, usamos o valor que realmente "entrou" (líquido)
      if (settings?.cardRates) {
          if (record.paymentMethod === PaymentMethod.DEBITO) {
             const rate = settings.cardRates.debit || 0;
             liquidAmount = record.amount * (1 - rate / 100);
          } else if (record.paymentMethod === PaymentMethod.CREDITO) {
             const rate = settings.cardRates.credit || 0;
             liquidAmount = record.amount * (1 - rate / 100);
          }
      }

      totalGeneral += liquidAmount;
      
      if (byMethod[record.paymentMethod] !== undefined) {
        // Acumula o valor (bruto ou líquido? Vamos usar líquido para consistência do total geral)
        // Se o usuário quer ver quanto RECEBEU, é o líquido.
        byMethod[record.paymentMethod] += liquidAmount;
      }

      const monthKey = record.serviceDate.substring(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + liquidAmount;
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
  }, [records, settings]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Geral - Maior Destaque */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors sm:col-span-2 lg:col-span-2 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Líquido (Recebido)</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{formatCurrency(stats.totalGeneral)}</h3>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full relative z-10">
            <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <TrendingUp className="w-40 h-40 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
          <div className="flex justify-between items-start mb-2">
             <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
             </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Pix</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(stats.byMethod[PaymentMethod.PIX])}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
          <div className="flex justify-between items-start mb-2">
             <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />
             </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Dinheiro</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(stats.byMethod[PaymentMethod.DINHEIRO])}</h3>
          </div>
        </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                {settings?.cardRates?.debit ? (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">-{settings.cardRates.debit}%</span>
                ) : null}
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Débito</p>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(stats.byMethod[PaymentMethod.DEBITO])}</h3>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                    <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                {settings?.cardRates?.credit ? (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">-{settings.cardRates.credit}%</span>
                ) : null}
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Crédito</p>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(stats.byMethod[PaymentMethod.CREDITO])}</h3>
            </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Faturamento Mensal (Líquido)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis 
                    dataKey="name" 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <YAxis 
                    tickFormatter={(value) => `R$${value}`} 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    tickLine={false} 
                    axisLine={false}
                />
                <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-700 shadow-xl rounded-lg outline-none">
                                    <p className="font-semibold text-slate-800 dark:text-white mb-2">{label}</p>
                                    <div className="space-y-1">
                                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium flex justify-between gap-4">
                                            <span>Faturamento:</span>
                                            <span>{formatCurrency(data.value)}</span>
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium flex justify-between gap-4">
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
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Por Forma de Pagamento</h3>
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