import React, { useState } from 'react';
import { ServiceRecord } from '../types';
import { formatDate } from '../utils/formatters';
import { Calendar, Phone, Clock, CheckCircle, Plus, Pencil, Trash2, Check, X, MessageCircle } from 'lucide-react';

interface AgendaProps {
  records: ServiceRecord[];
  onFinish: (record: ServiceRecord) => void;
  onNew: () => void;
  onEdit: (record: ServiceRecord) => void;
  onDelete: (record: ServiceRecord) => void;
  whatsappMessageTemplate: string | undefined;
}

const AgendaCard: React.FC<{
  record: ServiceRecord;
  onFinish: (record: ServiceRecord) => void;
  onEdit: (record: ServiceRecord) => void;
  onDelete: (record: ServiceRecord) => void;
  whatsappMessageTemplate: string | undefined;
}> = ({ record, onFinish, onEdit, onDelete, whatsappMessageTemplate }) => {
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

  const isOneDayBefore = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = dateString.split('-').map(Number);
    const serviceDate = new Date(year, month - 1, day);
    
    // Diferença em milissegundos
    const diffTime = serviceDate.getTime() - today.getTime();
    // Converter para dias
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 1;
  };

  const handleWhatsAppReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!record.clientPhone) return;

    const cleanPhone = record.clientPhone.replace(/\D/g, '');
    
    const template = whatsappMessageTemplate || 'Olá {nome}! Passando para confirmar nosso agendamento amanhã às {horario}. Tudo certo?';
    
    const message = template
        .replace(/{nome}/g, record.clientName)
        .replace(/{horario}/g, record.serviceTime || '');
    
    // Assumindo DDI 55 (Brasil) se não houver
    const phoneWithDDI = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    const url = `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const isEventToday = isToday(record.serviceDate);
  const showReminder = isOneDayBefore(record.serviceDate) && record.clientPhone;

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full ${isEventToday ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
      
      <div className="flex justify-between items-start mb-3">
        <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-semibold ${
            isEventToday 
            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' 
            : 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
            <Clock className="w-3 h-3" />
            {isEventToday ? 'Hoje' : 'Agendado'}
        </div>
        
        <div className="flex items-center gap-2">
            {/* Lembrete WhatsApp - Aparece 1 dia antes */}
            {showReminder && !isDeleting && (
                <button 
                    onClick={handleWhatsAppReminder}
                    className="relative flex items-center justify-center p-2 mr-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-none group/btn"
                    title="Enviar lembrete no WhatsApp"
                >
                    {/* Efeito de Ping (Radar) para chamar atenção */}
                    <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                    
                    <MessageCircle className="w-4 h-4 relative z-10 fill-current" />
                </button>
            )}

            <div className="flex items-center gap-1 h-7">
                {!isDeleting ? (
                    <>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(record);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                            title="Editar"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleting(true);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Excluir"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </>
                ) : (
                    <div className="flex items-center bg-red-50 dark:bg-red-900/20 rounded-md p-0.5 animate-in fade-in slide-in-from-right-2 duration-200">
                         <span className="text-[10px] text-red-600 dark:text-red-400 font-bold mr-1 ml-1">Excluir?</span>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(record);
                            }} 
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded transition-colors"
                            title="Confirmar"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleting(false);
                            }} 
                            className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Cancelar"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{record.clientName}</h4>
      
      {record.clientPhone && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
          <Phone className="w-3 h-3" />
          {record.clientPhone}
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg mb-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 italic">"{record.description}"</p>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
        <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="font-medium">
                {formatDate(record.serviceDate)}
                {record.serviceTime && ` às ${record.serviceTime}`}
            </span>
        </div>
      </div>

      <button
        onClick={() => onFinish(record)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors font-medium text-sm group-hover:bg-indigo-600 dark:group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:text-white"
      >
        <CheckCircle className="w-4 h-4" />
        Finalizar Atendimento
      </button>
    </div>
  );
};

const Agenda: React.FC<AgendaProps> = ({ records, onFinish, onNew, onEdit, onDelete, whatsappMessageTemplate }) => {
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
       <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Próximos Agendamentos</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seus serviços agendados</p>
        </div>
        <button 
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium shadow-md shadow-amber-200 dark:shadow-none"
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
              whatsappMessageTemplate={whatsappMessageTemplate}
            />
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-800 p-12 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center transition-colors">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">Nenhum agendamento</h3>
            <p className="text-slate-500 dark:text-slate-400">Sua agenda está livre por enquanto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;