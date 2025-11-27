
import React, { useState, useEffect } from 'react';
import { PaymentMethod, ServiceRecord } from '../types';
import { calculateReturnDate } from '../utils/formatters';
import { PlusCircle, Calendar, Save, Plus, Minus, Clock } from 'lucide-react';

interface ServiceFormProps {
  onAdd: (record: Omit<ServiceRecord, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<ServiceRecord>; // Para quando estiver finalizando um agendamento
  isScheduling?: boolean; // Se verdadeiro, esconde campos financeiros
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onAdd, onCancel, initialData, isScheduling = false }) => {
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || '');
  const [serviceDate, setServiceDate] = useState(initialData?.serviceDate || new Date().toISOString().split('T')[0]);
  const [serviceTime, setServiceTime] = useState(initialData?.serviceTime || '');
  const [returnDate, setReturnDate] = useState(initialData?.returnDate || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.paymentMethod || PaymentMethod.PIX);
  const [amount, setAmount] = useState<string>(initialData?.amount ? initialData.amount.toString() : '');

  // Auto-calculate return date when service date changes, only if not provided initially or if date changes
  useEffect(() => {
    if (serviceDate && !initialData?.returnDate) {
      setReturnDate(calculateReturnDate(serviceDate));
    } else if (serviceDate && initialData?.returnDate && serviceDate !== initialData.serviceDate) {
       // Se mudar a data do serviço durante a edição, recalcula
       setReturnDate(calculateReturnDate(serviceDate));
    }
  }, [serviceDate, initialData]);

  const adjustReturnDate = (days: number) => {
    if (!returnDate) return;
    const date = new Date(returnDate);
    date.setUTCDate(date.getUTCDate() + days);
    setReturnDate(date.toISOString().split('T')[0]);
  };

  const getReturnDateWeekday = () => {
    if (!returnDate) return '';
    const date = new Date(returnDate);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(adjustedDate);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    
    if (value.length === 0) {
      setClientPhone("");
      return;
    }

    if (value.length > 11) value = value.slice(0, 11);
    
    // Formatação (XX) XXXXX-XXXX
    if (value.length > 10) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 5) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    } else {
         value = value.replace(/^(\d*)/, "($1");
    }
    
    setClientPhone(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !serviceDate) return;

    // Se NÃO for agendamento, precisa do valor
    if (!isScheduling && !amount) return;

    onAdd({
      clientName,
      clientPhone,
      serviceDate,
      serviceTime,
      returnDate,
      description,
      paymentMethod: isScheduling ? undefined : paymentMethod,
      amount: isScheduling ? undefined : parseFloat(amount),
      status: isScheduling ? 'agendado' : 'concluido'
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${isScheduling ? 'bg-amber-100' : 'bg-indigo-100'}`}>
          {isScheduling ? (
             <Clock className="w-6 h-6 text-amber-600" />
          ) : (
             <PlusCircle className="w-6 h-6 text-indigo-600" />
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isScheduling ? 'Agendar Serviço' : 'Registrar Atendimento Realizado'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome do Cliente</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ex: Ana Silva"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Celular</label>
            <input
              type="tel"
              value={clientPhone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data</label>
                    <div>
                    <input
                        type="date"
                        required
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Horário</label>
                    <div>
                        <input
                            type="time"
                            value={serviceTime}
                            onChange={(e) => setServiceTime(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Data de Retorno Prevista</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustReturnDate(-1)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"
                title="Diminuir 1 dia"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <div className="relative flex-1">
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center font-medium text-slate-700"
                />
              </div>

              <button
                type="button"
                onClick={() => adjustReturnDate(1)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"
                title="Adicionar 1 dia"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-between items-center px-1">
              <p className="text-xs text-slate-500">Auto: +20 dias</p>
              {returnDate && (
                <p className="text-xs font-medium text-indigo-600 capitalize">
                  {getReturnDateWeekday()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Descrição do Serviço</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
            placeholder="Descreva o que será feito..."
          />
        </div>

        {!isScheduling && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {Object.values(PaymentMethod).map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Valor (R$)</label>
              <input
                type="number"
                required={!isScheduling}
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`flex items-center gap-2 px-6 py-2 text-white font-medium rounded-lg transition-colors shadow-md ${
                isScheduling 
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isScheduling ? <Clock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isScheduling ? 'Agendar' : 'Salvar Atendimento'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
