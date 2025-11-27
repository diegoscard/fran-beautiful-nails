import React, { useState } from 'react';
import { ServiceRecord, PaymentMethod } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';
import { Search, Filter, Phone, Calendar, ArrowRight, Pencil, Trash2, Check, X } from 'lucide-react';

interface ServiceListProps {
  records: ServiceRecord[];
  onEdit: (record: ServiceRecord) => void;
  onDelete: (record: ServiceRecord) => void;
}

const ServiceRow: React.FC<{
    record: ServiceRecord;
    getPaymentBadgeColor: (method?: PaymentMethod) => string;
    onEdit: (record: ServiceRecord) => void;
    onDelete: (record: ServiceRecord) => void;
}> = ({ record, getPaymentBadgeColor, onEdit, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    return (
        <tr className="hover:bg-slate-50/80 transition-colors group">
            <td className="px-6 py-4">
            <div className="font-medium text-slate-900">{record.clientName}</div>
            {record.clientPhone && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <Phone className="w-3 h-3" />
                {record.clientPhone}
                </div>
            )}
            </td>
            <td className="px-6 py-4">
                <div className="text-slate-800 text-sm mb-1 truncate max-w-[200px]">{record.description}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {formatDate(record.serviceDate)}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                <ArrowRight className="w-3 h-3" />
                {formatDate(record.returnDate)}
                </div>
            </td>
            <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPaymentBadgeColor(record.paymentMethod)}`}>
                {record.paymentMethod || '-'}
            </span>
            </td>
            <td className="px-6 py-4 text-right font-medium text-slate-900">
            {record.amount ? formatCurrency(record.amount) : '-'}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!isDeleting ? (
                        <>
                            <button 
                                onClick={() => onEdit(record)} 
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                title="Editar"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setIsDeleting(true)} 
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Excluir"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center bg-red-50 rounded-md p-1 animate-in fade-in slide-in-from-right-2 duration-200">
                            <span className="text-[10px] text-red-600 font-bold mr-2 ml-1">Excluir?</span>
                            <button 
                                onClick={() => onDelete(record)} 
                                className="p-1 text-red-600 hover:bg-red-200 rounded transition-colors mr-1"
                                title="Confirmar"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setIsDeleting(false)} 
                                className="p-1 text-slate-400 hover:bg-slate-200 rounded transition-colors"
                                title="Cancelar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

const ServiceList: React.FC<ServiceListProps> = ({ records, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Only show completed records
  const filteredRecords = records
    .filter(record => record.status === 'concluido')
    .filter(record => {
      const matchesSearch = record.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMonth = filterMonth ? record.serviceDate.startsWith(filterMonth) : true;
      
      return matchesSearch && matchesMonth;
    })
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());

  const getPaymentBadgeColor = (method?: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.PIX: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case PaymentMethod.DINHEIRO: return 'bg-green-100 text-green-800 border-green-200';
      case PaymentMethod.DEBITO: return 'bg-blue-100 text-blue-800 border-blue-200';
      case PaymentMethod.CREDITO: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header & Filters */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800">Histórico de Atendimentos</h2>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="relative">
             <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
                type="month" 
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            />
          </div>
        </div>
      </div>

      {/* List / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Serviço / Data</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Retorno</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagamento</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Valor</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <ServiceRow 
                    key={record.id} 
                    record={record} 
                    getPaymentBadgeColor={getPaymentBadgeColor}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  Nenhum atendimento realizado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
        Mostrando {filteredRecords.length} registros
      </div>
    </div>
  );
};

export default ServiceList;