import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Save, Image as ImageIcon, MessageCircle, Download, RefreshCw, AlertTriangle, Moon, Sun } from 'lucide-react';

export interface AppSettings {
  companyName: string;
  logo: string | null;
  whatsappMessageTemplate?: string;
  theme?: 'light' | 'dark';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  currentSettings: AppSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [companyName, setCompanyName] = useState(currentSettings.companyName);
  const [logo, setLogo] = useState<string | null>(currentSettings.logo);
  const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState(
    currentSettings.whatsappMessageTemplate || 'Olá {nome}! Passando para confirmar nosso agendamento amanhã às {horario}. Tudo certo?'
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(currentSettings.theme || 'light');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCompanyName(currentSettings.companyName);
      setLogo(currentSettings.logo);
      setWhatsappMessageTemplate(
        currentSettings.whatsappMessageTemplate || 'Olá {nome}! Passando para confirmar nosso agendamento amanhã às {horario}. Tudo certo?'
      );
      setTheme(currentSettings.theme || 'light');
    }
  }, [isOpen, currentSettings]);

  // Preview Imediato do Tema
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ companyName, logo, whatsappMessageTemplate, theme });
  };

  const handleCancel = () => {
    // Reverter o tema visualmente se cancelar
    if (currentSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    onClose();
  };

  // --- Lógica de Backup ---

  const handleExportData = () => {
    try {
        const records = localStorage.getItem('niel_design_records_v1');
        const expenses = localStorage.getItem('niel_design_expenses_v1');
        const settings = localStorage.getItem('niel_design_settings_v1');

        const backupData = {
            records: records ? JSON.parse(records) : [],
            expenses: expenses ? JSON.parse(expenses) : [],
            settings: settings ? JSON.parse(settings) : {},
            backupDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-${companyName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Erro ao criar backup: ' + error);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!window.confirm('ATENÇÃO: Isso irá substituir TODOS os dados atuais pelos dados do backup. Deseja continuar?')) {
          if (backupInputRef.current) backupInputRef.current.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const content = event.target?.result as string;
              const parsedData = JSON.parse(content);

              if (parsedData.records) localStorage.setItem('niel_design_records_v1', JSON.stringify(parsedData.records));
              if (parsedData.expenses) localStorage.setItem('niel_design_expenses_v1', JSON.stringify(parsedData.expenses));
              if (parsedData.settings) localStorage.setItem('niel_design_settings_v1', JSON.stringify(parsedData.settings));

              alert('Dados restaurados com sucesso! A página será recarregada.');
              window.location.reload();
          } catch (error) {
              alert('Erro ao ler arquivo de backup. Verifique se é um arquivo válido.');
              console.error(error);
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Personalizar Sistema</h3>
          <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Logo da Empresa</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-700 relative group">
                {logo ? (
                  <img src={logo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Carregar Imagem
                </button>
                {logo && (
                    <button 
                    type="button" 
                    onClick={() => setLogo(null)}
                    className="px-3 py-1.5 text-red-600 dark:text-red-400 text-sm font-medium rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                    >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover
                    </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>
          </div>

          {/* Name Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Nome da Empresa</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Ex: Espaço Fran"
            />
          </div>

          {/* Theme Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Aparência</label>
            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                        theme === 'light'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                >
                    <Sun className="w-4 h-4" />
                    Claro
                </button>
                <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                        theme === 'dark'
                        ? 'bg-slate-900 border-slate-700 text-white ring-1 ring-slate-600'
                        : 'bg-white border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                >
                    <Moon className="w-4 h-4" />
                    Escuro
                </button>
            </div>
          </div>

          {/* WhatsApp Message Template Section */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Mensagem de Lembrete (WhatsApp)</label>
            </div>
            <textarea
              rows={3}
              value={whatsappMessageTemplate}
              onChange={(e) => setWhatsappMessageTemplate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
              placeholder="Digite a mensagem padrão..."
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Use <strong>{'{nome}'}</strong> para o nome do cliente e <strong>{'{horario}'}</strong> para a hora do agendamento.
            </p>
          </div>

          {/* Backup Section */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-amber-500" />
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Dados e Backup</label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={handleExportData}
                    className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
                >
                    <Download className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-1" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Baixar Backup</span>
                </button>
                
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => backupInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
                    >
                        <Upload className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 mb-1" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Restaurar Dados</span>
                    </button>
                    <input 
                        type="file"
                        ref={backupInputRef}
                        onChange={handleImportData}
                        accept=".json"
                        className="hidden"
                    />
                </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Faça backups regulares para não perder seus dados.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;