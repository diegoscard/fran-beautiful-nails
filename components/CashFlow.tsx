import React, { useState, useMemo } from 'react';
import { ServiceRecord, ExpenseRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Save, Calendar, Clock } from 'lucide-react';

interface CashFlowProps {
  serviceRecords: ServiceRecord[];
  expenseRecords: ExpenseRecord[];
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
}

const CashFlow: React.FC<CashFlowProps> = ({ serviceRecords, expenseRecords, onAddExpense, onDeleteExpense }) => {
  // Estado do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'expense' | 'income'>('expense');

  // Filtros
  const [filterMode, setFilterMode] = useState<'month' | 'day'>('month');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM atual
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD atual

  // Combinar e calcular dados
  const { transactions, totals } = useMemo(() => {
    // 1. Preparar atendimentos (apenas concluídos) como entradas
    const serviceTransactions = serviceRecords
      .filter(r => r.status === 'concluido' && r.amount)
      .map(r => ({
        id: r.id,
        description: `Serviço: ${r.clientName} - ${r.description}`,
        amount: r.amount || 0,
        date: r.serviceDate,
        type: 'income' as const,
        isService: true, // Flag para identificar que vem do módulo de serviços
        originalRecord: r
      }));

    // 2. Preparar despesas manuais
    const manualTransactions = expenseRecords.map(r => ({
      id: r.id,
      description: r.description,
      amount: r.amount,
      date: r.date,
      type: r.type,
      isService: false,
      originalRecord: null
    }));

    // 3. Combinar tudo
    const all = [...serviceTransactions, ...manualTransactions];

    // 4. Filtrar pelo modo selecionado
    const filtered = all.filter(t => {
        if (filterMode === 'month') {
            return t.date.startsWith(filterMonth);
        } else {
            return t.date === filterDate;
        }
    });

    // 5. Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 6. Calcular totais
    const income = filtered.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = income - expense;

    return { transactions: filtered, totals: { income, expense, balance } };
  }, [serviceRecords, expenseRecords, filterMonth, filterDate, filterMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return;

    onAddExpense({
      description,
      amount: parseFloat(amount),
      date,
      type
    });

    // Limpar form
    setDescription('');
    setAmount('');
    setType('expense'); // Volta para despesa por padrão
  };

  const getHeaderTitle = () => {
      if (filterMode === 'month') {
          return filterMonth.split('-').reverse().join('/');
      }
      return filterDate.split('-').reverse().join('/');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header com Filtro de Data */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Movimentações de {getHeaderTitle()}
        </h2>
        
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex gap-1">
                <button
                    onClick={() => setFilterMode('day')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                        filterMode === 'day' 
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <Clock className="w-3.5 h-3.5" />
                    Diário
                </button>
                <button
                    onClick={() => setFilterMode('month')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                        filterMode === 'month' 
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    <Calendar className="w-3.5 h-3.5" />
                    Mensal
                </button>
            </div>
            
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-500 mx-1"></div>

            {filterMode === 'month' ? (
                <input 
                    type="month" 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="px-2 py-1 bg-transparent border-none text-sm text-slate-700 dark:text-slate-200 font-medium focus:ring-0 cursor-pointer"
                />
            ) : (
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-2 py-1 bg-transparent border-none text-sm text-slate-700 dark:text-slate-200 font-medium focus:ring-0 cursor-pointer"
                />
            )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowUpCircle className="w-24 h-24 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Entradas</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.income)}</h3>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Receita do período
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ArrowDownCircle className="w-24 h-24 text-red-600" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Saídas</p>
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.expense)}</h3>
          <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-2 font-medium flex items-center gap-1">
             <TrendingDown className="w-3 h-3" /> Despesas do período
          </p>
        </div>

        <div className={`p-6 rounded-xl shadow-sm border relative overflow-hidden transition-colors ${
            totals.balance >= 0 
            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-200 dark:border-indigo-800 text-white' 
            : 'bg-gradient-to-br from-red-500 to-red-600 border-red-200 dark:border-red-800 text-white'
        }`}>
           <div className="absolute top-0 right-0 p-4 opacity-20">
             <Wallet className="w-24 h-24 text-white" />
          </div>
          <p className="text-sm font-medium text-white/80 mb-1">Saldo Final</p>
          <h3 className="text-3xl font-bold text-white">{formatCurrency(totals.balance)}</h3>
          <p className="text-xs text-white/80 mt-2">
            Balanço consolidado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulário de Lançamento */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Lançar Movimentação
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Tipo</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    type === 'expense' 
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-2 ring-red-500 ring-offset-1 dark:ring-offset-slate-800' 
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" /> Saída
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    type === 'income' 
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-800' 
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" /> Entrada Extra
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Descrição</label>
              <input 
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'expense' ? "Ex: Conta de Luz, Materiais..." : "Ex: Venda de Produto..."}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Valor (R$)</label>
                <input 
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Data</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-w-0"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full py-2.5 rounded-lg text-white font-medium shadow-md transition-all flex items-center justify-center gap-2 ${
                  type === 'expense' 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-none' 
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-none'
              }`}
            >
              <Save className="w-4 h-4" />
              {type === 'expense' ? 'Registrar Despesa' : 'Registrar Entrada'}
            </button>
          </form>
        </div>

        {/* Tabela de Extrato */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
             <h3 className="font-bold text-slate-800 dark:text-white">Extrato Detalhado</h3>
          </div>
          
          <div className="overflow-y-auto max-h-[500px]">
            {transactions.length > 0 ? (
                <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm">
                    <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Valor</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 w-32">
                        {formatDate(t.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">
                            {t.description}
                            {t.isService && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800">Atendimento</span>}
                        </td>
                        <td className={`px-4 py-3 text-sm font-bold text-right ${
                            t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                            {!t.isService && (
                                <button 
                                    onClick={() => onDeleteExpense(t.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                    title="Excluir Lançamento"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            ) : (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhuma movimentação neste período.</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CashFlow;