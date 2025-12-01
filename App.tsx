import React, { useState, useEffect } from 'react';
import { ServiceRecord, ExpenseRecord } from './types';
import ServiceForm from './components/ServiceForm';
import ServiceList from './components/ServiceList';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import CashFlow from './components/CashFlow';
import SettingsModal, { AppSettings } from './components/SettingsModal';
import { LayoutDashboard, Plus, List, Sparkles, Calendar, Settings, ArrowRightLeft, Menu, X } from 'lucide-react';

const STORAGE_KEY = 'niel_design_records_v1';
const SETTINGS_KEY = 'niel_design_settings_v1';
const EXPENSES_KEY = 'niel_design_expenses_v1';

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Beautiful Nails',
  logo: null,
  whatsappMessageTemplate: 'Olá {nome}! Passando para confirmar nosso agendamento amanhã às {horario}. Tudo certo?',
  theme: 'light'
};

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'add' | 'agenda' | 'cashflow'>('agenda');
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  
  // State for settings
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // State for converting a schedule to a completed service OR editing a schedule
  const [finishingRecord, setFinishingRecord] = useState<ServiceRecord | null>(null);
  // State for determining if the form is in scheduling mode
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);

  // State for Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem(STORAGE_KEY);
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error("Failed to load records", e);
      }
    }

    const savedExpenses = localStorage.getItem(EXPENSES_KEY);
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (e) {
        console.error("Failed to load expenses", e);
      }
    }

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  // Effect to update browser Favicon based on company logo
  useEffect(() => {
    const updateFavicon = (url: string) => {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = url;
    };

    if (settings.logo) {
      updateFavicon(settings.logo);
    } else {
      const defaultIconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="8" fill="#4f46e5"/>
          <path d="M16 6L13.5 13.5L6 16L13.5 18.5L16 26L18.5 18.5L26 16L18.5 13.5L16 6Z" fill="white" />
        </svg>
      `;
      const encodedSvg = encodeURIComponent(defaultIconSvg);
      updateFavicon(`data:image/svg+xml,${encodedSvg}`);
    }
  }, [settings.logo]);

  // Effect to handle Theme (Light/Dark)
  useEffect(() => {
    if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Save records to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  // Save expenses to local storage
  useEffect(() => {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
        setIsSettingsOpen(false);
    } catch (e) {
        alert("Erro ao salvar: A imagem pode ser muito grande. Tente uma imagem menor.");
        console.error(e);
    }
  };

  const handleAddRecord = (newRecordData: Omit<ServiceRecord, 'id' | 'createdAt'>) => {
    if (finishingRecord) {
        const targetStatus = isSchedulingMode ? 'agendado' : 'concluido';

        setRecords(prev => prev.map(r => 
            r.id === finishingRecord.id 
            ? { ...r, ...newRecordData, status: targetStatus } 
            : r
        ));
        setFinishingRecord(null);
        
        if (targetStatus === 'agendado') {
            setActiveTab('agenda');
        } else {
            setActiveTab('list');
        }
    } else {
        const newRecord: ServiceRecord = {
            ...newRecordData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        setRecords(prev => [newRecord, ...prev]);
        
        if (newRecord.status === 'agendado') {
            setActiveTab('agenda');
        } else {
            setActiveTab('list');
        }
    }
    setIsSchedulingMode(false);
  };

  const handleAddExpense = (expenseData: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const startFinishing = (record: ServiceRecord) => {
    setFinishingRecord(record);
    setIsSchedulingMode(false);
    setActiveTab('add');
    closeMobileMenu();
  };

  const startEditingSchedule = (record: ServiceRecord) => {
    setFinishingRecord(record);
    setIsSchedulingMode(true);
    setActiveTab('add');
    closeMobileMenu();
  };

  const startEditingHistoryRecord = (record: ServiceRecord) => {
    setFinishingRecord(record);
    setIsSchedulingMode(false);
    setActiveTab('add');
    closeMobileMenu();
  };

  const handleDeleteRecord = (record: ServiceRecord) => {
    setRecords(prev => prev.filter(r => r.id !== record.id));
  };

  const startNewSchedule = () => {
    setFinishingRecord(null);
    setIsSchedulingMode(true);
    setActiveTab('add');
    closeMobileMenu();
  };

  const startNewService = () => {
    setFinishingRecord(null);
    setIsSchedulingMode(false);
    setActiveTab('add');
    closeMobileMenu();
  }

  const handleCancelForm = () => {
    setFinishingRecord(null);
    setIsSchedulingMode(false);
    if (activeTab === 'add' && isSchedulingMode) {
        setActiveTab('agenda');
    } else {
        setActiveTab('list');
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    closeMobileMenu();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  }

  const getPageTitle = () => {
    if (activeTab === 'agenda') return 'Agenda de Serviços';
    if (activeTab === 'dashboard') return 'Visão Geral';
    if (activeTab === 'list') return 'Histórico Completo';
    if (activeTab === 'cashflow') return 'Fluxo de Caixa';
    if (activeTab === 'add') {
      if (finishingRecord) {
        if (isSchedulingMode) return 'Editar Agendamento';
        if (finishingRecord.status === 'concluido') return 'Editar Atendimento';
        return 'Finalizar Atendimento';
      }
      return isSchedulingMode ? 'Novo Agendamento' : 'Novo Atendimento';
    }
    return '';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      
      {/* Sidebar Navigation - Fixed Top on Mobile, Sidebar on Desktop */}
      <aside className={`
        bg-slate-900 text-white shadow-xl z-50 flex flex-col transition-all duration-300
        fixed top-0 left-0 right-0                  /* Mobile: Fixed at top */
        md:relative md:w-64 md:h-screen md:sticky md:top-0  /* Desktop: Sidebar, sticky */
        ${isMobileMenuOpen ? 'h-screen' : 'h-20 md:h-screen'} /* Mobile: Expand height when open */
      `}>
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between md:justify-start gap-3 relative group h-20 md:h-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover bg-slate-800" />
              ) : (
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold tracking-tight truncate max-w-[200px] md:max-w-full">{settings.companyName}</h1>
              <p className="text-xs text-slate-400">Controle de Atendimento</p>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop Settings Button */}
          <button 
             onClick={() => setIsSettingsOpen(true)}
             className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-700 backdrop-blur-sm"
             title="Configurar"
          >
             <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links - Hidden on Mobile unless open, Visible on Desktop */}
        <div className={`
            flex-1 flex flex-col overflow-y-auto
            ${isMobileMenuOpen ? 'block' : 'hidden'} md:flex
        `}>
          <nav className="p-4 space-y-2">
            <button
              onClick={() => handleTabChange('agenda')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'agenda' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Agenda
            </button>

            <button
              onClick={() => {
                startNewService();
                closeMobileMenu();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'add' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Plus className="w-5 h-5" />
              Novo Atendimento
            </button>

            <button
              onClick={() => handleTabChange('list')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'list' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
              Histórico
            </button>

            <button
              onClick={() => handleTabChange('cashflow')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'cashflow' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-5 h-5" />
              Fluxo de Caixa
            </button>

            <button
              onClick={() => handleTabChange('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Resumo Financeiro
            </button>

            {/* Mobile Settings Button (Inside menu) */}
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                closeMobileMenu();
              }}
              className="w-full flex md:hidden items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
              Configurações
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800 text-center mt-auto">
            <p className="text-xs text-slate-500">Scard System v1.0.0 &copy; 2025</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50/50 dark:bg-slate-950 transition-colors duration-200 pt-24 md:pt-0">
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          
          <header className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{getPageTitle()}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
              {activeTab === 'agenda' && 'Gerencie seus próximos atendimentos e compromissos.'}
              {activeTab === 'dashboard' && 'Acompanhe seus resultados financeiros e metas.'}
              {activeTab === 'list' && 'Lista de todos os serviços já realizados.'}
              {activeTab === 'cashflow' && 'Controle de entradas, saídas e despesas.'}
              {activeTab === 'add' && 'Preencha os dados do serviço.'}
            </p>
          </header>

          <div className="animate-fade-in-up pb-10">
            {activeTab === 'dashboard' && <Dashboard records={records} />}
            {activeTab === 'list' && (
                <ServiceList 
                    records={records} 
                    onEdit={startEditingHistoryRecord} 
                    onDelete={handleDeleteRecord} 
                />
            )}
            {activeTab === 'agenda' && (
                <Agenda 
                    records={records} 
                    onFinish={startFinishing} 
                    onNew={startNewSchedule} 
                    onEdit={startEditingSchedule}
                    onDelete={handleDeleteRecord}
                    whatsappMessageTemplate={settings.whatsappMessageTemplate || DEFAULT_SETTINGS.whatsappMessageTemplate}
                />
            )}
            {activeTab === 'cashflow' && (
                <CashFlow 
                  serviceRecords={records}
                  expenseRecords={expenses}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
            )}
            {activeTab === 'add' && (
              <ServiceForm 
                onAdd={handleAddRecord} 
                onCancel={handleCancelForm}
                initialData={finishingRecord || undefined}
                isScheduling={isSchedulingMode}
              />
            )}
          </div>
        </div>
        
        {/* Settings Modal */}
        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
            currentSettings={settings}
        />
      </main>
    </div>
  );
}

export default App;