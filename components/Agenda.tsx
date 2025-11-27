
import React, { useState } from 'react';
import { ServiceRecord } from '../types';
import { formatDate } from '../utils/formatters';
import { Calendar, Phone, Clock, CheckCircle, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface AgendaProps {
  records: ServiceRecord[];
  onFinish: (record: ServiceRecord) => void;
  onNew: () => void;
  onEdit: (record: ServiceRecord) => void;
  onDelete: (record: ServiceRecord) => void;
}

const AgendaCard: React.FC<{
  record: ServiceRecord;
  onFinish: (record: ServiceRecord) => void;
  onEdit: (record: ServiceRecord) => void;
  onDelete: (record: ServiceRecord) => void;
}> = ({ record, onFinish, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const isToday = (dateString: string) => {
    const today = new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return (
      today.getDate() === day &&
      today.getMonth() + 1 === month &&
      today.getFullYear() === year
    );
  };

  const isEventToday = isToday(record.serviceDate);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full ${isEventToday ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
      
      <div className="flex justify-between items-start mb-3">
        <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-semibold ${
            isEventToday 
            ? 'text-emerald-700 bg-emerald-50' 
            : 'text-amber-600 bg-amber-50'
        }`}>
            <Clock className="w-3 h-3" />
            {isEventToday ? 'Hoje' : 'Agendado'}
        </div>
        
        <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400">
                ID: {record.id.slice(0, 4)}
            </div>
            <div className="flex items-center gap-1 h-7">
                {!isDeleting ? (
                    <>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(record);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Editar"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleting(true);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Excluir"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </>
                ) : (
                    <div className="flex items-center bg-red-50 rounded-md p-0.5 animate-in fade-in slide-in-from-right-2 duration-200">
                         <span className="text-[10px] text-red-600 font-bold mr-1 ml-1">Excluir?</span>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(record);
                            }} 
                            className="p-1 text-red-600 hover:bg-red-200 rounded transition-colors"
                            title="Confirmar"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleting(false);
                            }} 
                            className="p-1 text-slate-400 hover:bg-slate-200 rounded transition-colors"
                            title="Cancelar"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <h4 className="font-bold text-slate-800 text-lg mb-1">{record.clientName}</h4>
      
      {record.clientPhone && (
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Phone className="w-3 h-3" />
          {record.clientPhone}
        </div>
      )}

      <div className="bg-slate-50 p-3 rounded-lg mb-4">
        <p className="text-sm text-slate-700 line-clamp-2 italic">"{record.description}"</p>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
        <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="font-medium">
                {formatDate(record.serviceDate)}
                {record.serviceTime && ` às ${record.serviceTime}`}
            </span>
        </div>
      </div>

      <button
        onClick={() => onFinish(record)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm group-hover:bg-indigo-600 group-hover:text-white"
      >
        <CheckCircle className="w-4 h-4" />
        Finalizar Atendimento
      </button>
    </div>
  );
};

const Agenda: React.FC<AgendaProps> = ({ records, onFinish, onNew, onEdit, onDelete }) => {
  // Filter for only scheduled items and sort by date (nearest first)
  const scheduledRecords = records
    .filter(r => r.status === 'agendado')
    .sort((a, b) => {
        const dateA = new Date(`${a.serviceDate}T${a.serviceTime || '00:00'}`);
        const dateB = new Date(`${b.serviceDate}T${b.serviceTime || '00:00'}`);
        return dateA.getTime() - dateB.getTime();
    });

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
            <h3 className="text-lg font-bold text-slate-800">Próximos Agendamentos</h3>
            <p className="text-sm text-slate-500">Gerencie seus serviços agendados</p>
        </div>
        <button 
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium shadow-md shadow-amber-200"
        >
            <Plus className="w-4 h-4" />
            Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scheduledRecords.length > 0 ? (
          scheduledRecords.map((record) => (
            <AgendaCard 
              key={record.id} 
              record={record} 
              onFinish={onFinish} 
              onEdit={onEdit} 
              onDelete={onDelete} 
            />
          ))
        ) : (
          <div className="col-span-full bg-white p-12 rounded-xl border border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">Nenhum agendamento</h3>
            <p className="text-slate-500">Sua agenda está livre por enquanto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;
