import React, { useState, useEffect } from 'react';
import { ServiceRecord, ExpenseRecord, User } from './types';
import ServiceForm from './components/ServiceForm';
import ServiceList from './components/ServiceList';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import CashFlow from './components/CashFlow';
import SettingsModal, { AppSettings } from './components/SettingsModal';
import AuthLogin from './components/AuthLogin';
import AdminPanel from './components/AdminPanel';
import { LayoutDashboard, Plus, List, Sparkles, Calendar, Settings, ArrowRightLeft, Menu, X, LogOut, Shield, User as UserIcon } from 'lucide-react';

// PREFIXOS BASE DAS CHAVES
const STORAGE_KEY_BASE = 'niel_design_records_v1';
const SETTINGS_KEY_BASE = 'niel_design_settings_v1';
const EXPENSES_KEY_BASE = 'niel_design_expenses_v1';

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Beautiful Nails',
  logo: null,
  whatsappMessageTemplate: 'Olá {nome}! Passando para confirmar nosso agendamento amanhã às {horario}. Tudo certo?',
  theme: 'light',
  cardRates: { debit: 0, credit: 0 }
};

function App() {
  // --- ESTADO DE AUTENTICAÇÃO ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- ESTADO DA APLICAÇÃO ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'add' | 'agenda' | 'cashflow' | 'admin'>('agenda');
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [finishingRecord, setFinishingRecord] = useState<ServiceRecord | null>(null);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Verificar se já existe login salvo ao iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('niel_app_current_user');
    if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. Carregar Dados do Usuário Específico
  useEffect(() => {
    if (!currentUser) return;

    // Constrói chaves únicas para este usuário: ex: niel_design_records_v1_user123
    // OBSERVAÇÃO IMPORTANTE PARA SISTEMA MULTI-USUÁRIO:
    // Num sistema real, todos veriam os mesmos dados da loja. 
    // Aqui estamos isolando dados por usuário para a demonstração local.
    // Se quiser compartilhar dados, teria que remover o `_${currentUser.id}` 
    // ou usar um ID de "Loja". Para manter simples e não quebrar dados existentes:
    // VAMOS USAR UM ID GLOBAL SE FOR MASTER OU ADMIN PARA VER TUDO,
    // Mas por enquanto, mantemos isolado para não complicar a persistência localstorage sem backend.
    
    // ATUALIZAÇÃO PARA FUNCIONÁRIOS:
    // Funcionários devem ver os dados do ADMIN/LOJA.
    // Como é LocalStorage, vamos assumir um "contexto de loja" compartilhado.
    // Para simplificar: Todos compartilham o mesmo "banco" localStorage base, exceto settings pessoais.
    const storageId = 'global_store_data'; // Unificando dados para simular uma loja única
    
    const userRecordsKey = `${STORAGE_KEY_BASE}_${storageId}`;
    const userExpensesKey = `${EXPENSES_KEY_BASE}_${storageId}`;
    const userSettingsKey = `${SETTINGS_KEY_BASE}_${storageId}`;

    // Carregar Registros
    const savedRecords = localStorage.getItem(userRecordsKey);
    if (savedRecords) {
      try { setRecords(JSON.parse(savedRecords)); } catch (e) { console.error(e); }
    } else {
        setRecords([]);
    }

    // Carregar Despesas
    const savedExpenses = localStorage.getItem(userExpensesKey);
    if (savedExpenses) {
      try { setExpenses(JSON.parse(savedExpenses)); } catch (e) { console.error(e); }
    } else {
        setExpenses([]);
    }

    // Carregar Configurações
    const savedSettings = localStorage.getItem(userSettingsKey);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } catch (e) { console.error(e); }
    } else {
        setSettings(DEFAULT_SETTINGS);
    }
    
    // Redirecionamento se usuário não tiver permissão na aba atual
    if (!hasPermission(activeTab) && activeTab !== 'add') {
        const firstPermitted = ['agenda', 'list', 'cashflow', 'dashboard', 'admin'].find(t => hasPermission(t));
        if (firstPermitted) {
            setActiveTab(firstPermitted as any);
        }
    }

  }, [currentUser]);

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

  // Effect to handle Theme
  useEffect(() => {
    if (!currentUser) {
        document.documentElement.classList.remove('dark');
        return;
    }
    
    if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [settings.theme, currentUser]);

  // Salvar registros no LocalStorage (Unificado)
  useEffect(() => {
    if (currentUser) {
        const storageId = 'global_store_data';
        localStorage.setItem(`${STORAGE_KEY_BASE}_${storageId}`, JSON.stringify(records));
    }
  }, [records, currentUser]);

  // Salvar despesas no LocalStorage (Unificado)
  useEffect(() => {
    if (currentUser) {
        const storageId = 'global_store_data';
        localStorage.setItem(`${EXPENSES_KEY_BASE}_${storageId}`, JSON.stringify(expenses));
    }
  }, [expenses, currentUser]);

  // --- PERMISSION CHECKER ---
  const hasPermission = (tab: string): boolean => {
      if (!currentUser) return false;
      
      // Master e Admin têm acesso a tudo
      if (currentUser.role === 'master' || currentUser.role === 'admin' || currentUser.isAdmin) {
          return true;
      }
      
      // Funcionário verifica a lista de permissões
      if (currentUser.role === 'employee') {
          // Admin Panel nunca é permitido para funcionário
          if (tab === 'admin') return false;
          // Se tiver permissões definidas, checa a lista
          if (currentUser.permissions) {
              return currentUser.permissions.includes(tab);
          }
          // Fallback seguro: se não tiver array, nega (ou permite só agenda, a critério)
          return false;
      }
      
      return false;
  };

  // --- HANDLERS DE AUTENTICAÇÃO ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('niel_app_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('niel_app_current_user');
    setRecords([]);
    setExpenses([]);
    setSettings(DEFAULT_SETTINGS);
    setActiveTab('agenda');
    document.documentElement.classList.remove('dark');
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    if (!currentUser) return;
    try {
        const storageId = 'global_store_data';
        localStorage.setItem(`${SETTINGS_KEY_BASE}_${storageId}`, JSON.stringify(newSettings));
        setSettings(newSettings);
        setIsSettingsOpen(false);
    } catch (e) {
        alert("Erro ao salvar: A imagem pode ser muito grande. Tente uma imagem menor.");
        console.error(e);
    }
  };

  // --- MÉTODOS ORIGINAIS DO SISTEMA (CRUD) ---

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
    if (hasPermission(tab)) {
        setActiveTab(tab);
        closeMobileMenu();
    } else {
        alert("Você não tem permissão para acessar esta área.");
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  }

  const getPageTitle = () => {
    if (activeTab === 'admin') return 'Painel Master / Admin';
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

  // --- ROTEAMENTO ---

  if (!currentUser) {
    return <AuthLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <aside className={`
        bg-slate-900 text-white shadow-xl z-50 flex flex-col transition-all duration-300
        fixed top-0 left-0 right-0                  
        md:relative md:w-64 md:h-screen md:sticky md:top-0  
        ${isMobileMenuOpen ? 'h-screen' : 'h-20 md:h-screen'} 
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
              {/* SAUDAÇÃO PERSONALIZADA */}
              <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                {currentUser.role === 'master' && <Shield className="w-3 h-3 text-purple-400" />}
                {currentUser.role === 'admin' && <Shield className="w-3 h-3 text-indigo-400" />}
                {currentUser.role === 'employee' && <UserIcon className="w-3 h-3 text-slate-400" />}
                <span>Olá, {currentUser.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {(currentUser.role === 'admin' || currentUser.role === 'master') && (
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-700 backdrop-blur-sm"
                title="Configurar"
            >
                <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className={`
            flex-1 flex flex-col overflow-y-auto
            ${isMobileMenuOpen ? 'block' : 'hidden'} md:flex
        `}>
          <nav className="p-4 space-y-2">
            {hasPermission('agenda') && (
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
            )}

            {/* Botão Novo Atendimento sempre visível, mas pode ser restrito se desejar */}
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

            {hasPermission('list') && (
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
            )}

            {hasPermission('cashflow') && (
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
            )}

            {hasPermission('dashboard') && (
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
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'master') && (
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
            )}

            {/* BOTÃO EXCLUSIVO PARA ADMIN/MASTER */}
            {(currentUser.role === 'admin' || currentUser.role === 'master') && (
                <button
                onClick={() => handleTabChange('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mt-4 border border-indigo-500/30 ${
                    activeTab === 'admin' 
                    ? 'bg-indigo-900/50 text-indigo-300 font-medium' 
                    : 'text-indigo-300 hover:bg-indigo-900/30 hover:text-white'
                }`}
                >
                <Shield className="w-5 h-5" />
                Painel Admin
                </button>
            )}
          </nav>

          <div className="p-4 border-t border-slate-800 mt-auto">
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" /> Sair
             </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto bg-slate-50/50 dark:bg-slate-950 transition-colors duration-200 pt-24 md:pt-0">
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          
          <header className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{getPageTitle()}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
              {activeTab === 'admin' && 'Gerenciamento de usuários e permissões.'}
              {activeTab === 'agenda' && 'Gerencie seus próximos atendimentos e compromissossss.'}
              {activeTab === 'dashboard' && 'Acompanhe seus resultados financeiros e metas.'}
              {activeTab === 'list' && 'Lista de todos os serviços já realizados.'}
              {activeTab === 'cashflow' && 'Controle de entradas, saídas e despesas.'}
              {activeTab === 'add' && 'Preencha os dados do serviço.'}
            </p>
          </header>

          <div className="animate-fade-in-up pb-10">
            {activeTab === 'admin' && (currentUser.role === 'admin' || currentUser.role === 'master') && <AdminPanel />}
            
            {activeTab === 'dashboard' && hasPermission('dashboard') && <Dashboard records={records} settings={settings} />}
            
            {activeTab === 'list' && hasPermission('list') && (
                <ServiceList 
                    records={records} 
                    onEdit={startEditingHistoryRecord} 
                    onDelete={handleDeleteRecord} 
                />
            )}
            
            {activeTab === 'agenda' && hasPermission('agenda') && (
                <Agenda 
                    records={records} 
                    onFinish={startFinishing} 
                    onNew={startNewSchedule} 
                    onEdit={startEditingSchedule}
                    onDelete={handleDeleteRecord}
                    whatsappMessageTemplate={settings.whatsappMessageTemplate || DEFAULT_SETTINGS.whatsappMessageTemplate}
                />
            )}
            
            {activeTab === 'cashflow' && hasPermission('cashflow') && (
                <CashFlow 
                  serviceRecords={records}
                  expenseRecords={expenses}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  settings={settings}
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