import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface AuthLoginProps {
  onLogin: (user: User) => void;
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isMasterMode, setIsMasterMode] = useState(false); // Estado para controlar o modo Master
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const toggleMasterMode = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita propagação se houver outros cliques
    setIsMasterMode(!isMasterMode);
    
    // Reseta estados ao trocar de modo
    setMode('login');
    setEmail('');
    setPassword('');
    setError('');
    setSuccessMsg('');
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Simulação de Banco de Dados de usuários
    const usersDb = JSON.parse(localStorage.getItem('niel_app_users_v1') || '[]');

    if (mode === 'login') {
      
      // LÓGICA DE LOGIN MASTER (Separada e Segura)
      if (isMasterMode) {
        if (email === 'scard' && password === 'system2025') {
            const masterUser: User = {
                id: 'master-global-id',
                email: 'scard-admin', 
                name: 'Scard Creator',
                createdAt: new Date().toISOString(),
                isAdmin: true,
                role: 'master',
                permissions: ['agenda', 'list', 'cashflow', 'dashboard', 'admin']
            };
            onLogin(masterUser);
            return;
        } else {
            setError('Credenciais Master inválidas.');
            return;
        }
      }

      // LOGIN NORMAL (Usuários e Admin padrão)
      // Mantemos o master@niel.com antigo como fallback se necessário, ou removemos para segurança total.
      // Aqui vou manter a verificação do banco normal.
      const foundUser = usersDb.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const userRole = foundUser.role || (foundUser.isAdmin ? 'admin' : 'employee');
        const { password, ...safeUser } = foundUser;
        onLogin({ ...safeUser, role: userRole } as User);
      } else {
        // Fallback legado para o admin hardcoded original, caso alguém use
        if (email === 'master@niel.com' && password === 'master123' && !isMasterMode) {
             const legacyMaster: User = {
                id: 'legacy-master-id',
                email: 'master@niel.com',
                name: 'Niel Creator',
                createdAt: new Date().toISOString(),
                isAdmin: true,
                role: 'master',
                permissions: ['agenda', 'list', 'cashflow', 'dashboard', 'admin']
            };
            onLogin(legacyMaster);
            return;
        }

        setError('E-mail ou senha incorretos.');
      }
    } 
    
    else if (mode === 'register') {
      if (!name || !email || !password) {
        setError('Preencha todos os campos.');
        return;
      }
      
      const userExists = usersDb.find((u: any) => u.email === email);
      if (userExists) {
        setError('Este e-mail já está cadastrado.');
        return;
      }

      const isFirstUser = usersDb.length === 0;
      const role = isFirstUser ? 'admin' : 'employee';
      const defaultPermissions = isFirstUser 
        ? ['agenda', 'list', 'cashflow', 'dashboard', 'admin'] 
        : ['agenda'];

      const newUser = {
        id: crypto.randomUUID(),
        email,
        password,
        name,
        createdAt: new Date().toISOString(),
        role: role,
        isAdmin: role === 'admin',
        permissions: defaultPermissions
      };

      const updatedUsers = [...usersDb, newUser];
      localStorage.setItem('niel_app_users_v1', JSON.stringify(updatedUsers));
      
      const { password: _, ...safeUser } = newUser;
      onLogin(safeUser as User);
    }

    else if (mode === 'forgot') {
      const userExists = usersDb.find((u: any) => u.email === email);
      
      if (userExists) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const updatedUsers = usersDb.map((u: any) => 
            u.email === email ? { ...u, password: tempPassword } : u
        );
        localStorage.setItem('niel_app_users_v1', JSON.stringify(updatedUsers));
        setSuccessMsg(`[SIMULAÇÃO] Sua nova senha temporária é: ${tempPassword}`);
      } else {
        setError('E-mail não encontrado.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header Visual - Muda de cor quando em modo Master */}
        <div 
            className={`p-8 text-center relative overflow-hidden transition-colors duration-500 ${
                isMasterMode ? 'bg-slate-950' : 'bg-indigo-600'
            }`}
        >
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <Sparkles className="w-64 h-64 text-white absolute -top-10 -left-10" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
                {/* Botão Secreto no Logo */}
                <button 
                    type="button"
                    onClick={toggleMasterMode}
                    className={`p-3 rounded-xl shadow-lg mb-4 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ${
                        isMasterMode ? 'bg-indigo-500' : 'bg-white'
                    }`}
                    title={isMasterMode ? "Voltar ao Login Padrão" : "Acesso Restrito"}
                >
                    {isMasterMode ? (
                        <ShieldCheck className="w-8 h-8 text-white" />
                    ) : (
                        <Sparkles className="w-8 h-8 text-indigo-600" />
                    )}
                </button>
                <h1 className="text-2xl font-bold text-white">
                    {isMasterMode ? 'System Access' : 'Scard System'}
                </h1>
                <p className={`text-sm mt-1 ${isMasterMode ? 'text-slate-400' : 'text-indigo-100'}`}>
                    {isMasterMode ? 'Painel do Criador' : 'Controle e Gestão Inteligente'}
                </p>
            </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center transition-all">
                {mode === 'login' && (isMasterMode ? 'Autenticação Master' : 'Acesse sua conta')}
                {mode === 'register' && 'Crie sua conta grátis'}
                {mode === 'forgot' && 'Recuperar Senha'}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800 animate-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg border border-emerald-100 dark:border-emerald-800 animate-in slide-in-from-top-2">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleAction} className="space-y-4">
                
                {mode === 'register' && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Nome Completo</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Seu nome"
                                required={mode === 'register'}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">
                        {isMasterMode ? 'Login' : 'E-mail'}
                    </label>
                    <div className="relative">
                        {isMasterMode ? (
                            <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        ) : (
                            <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        )}
                        <input 
                            type={isMasterMode ? "text" : "email"}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 outline-none transition-all ${
                                isMasterMode 
                                ? 'border-slate-300 focus:ring-slate-500 dark:border-slate-600' 
                                : 'border-slate-200 focus:ring-indigo-500 dark:border-slate-600'
                            }`}
                            placeholder={isMasterMode ? "Usuário do sistema" : "seu@email.com"}
                            required
                        />
                    </div>
                </div>

                {mode !== 'forgot' && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={`w-full pl-10 pr-10 py-2 border dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 outline-none transition-all ${
                                    isMasterMode 
                                    ? 'border-slate-300 focus:ring-slate-500 dark:border-slate-600' 
                                    : 'border-slate-200 focus:ring-indigo-500 dark:border-slate-600'
                                }`}
                                placeholder={isMasterMode ? "Senha do sistema" : "••••••••"}
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}

                <button 
                    type="submit" 
                    className={`w-full py-3 text-white font-bold rounded-lg shadow-lg dark:shadow-none transition-all flex items-center justify-center gap-2 mt-2 ${
                        isMasterMode 
                        ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-300' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                    }`}
                >
                    {mode === 'login' && (isMasterMode ? 'Acessar Painel' : 'Entrar no Sistema')}
                    {mode === 'register' && 'Cadastrar Grátis'}
                    {mode === 'forgot' && 'Recuperar Senha'}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center space-y-3">
                {!isMasterMode && mode === 'login' && (
                    <>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Ainda não tem conta?{' '}
                            <button onClick={() => {setMode('register'); setError('');}} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                                Cadastre-se
                            </button>
                        </p>
                        <button onClick={() => {setMode('forgot'); setError('');}} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            Esqueci minha senha
                        </button>
                    </>
                )}

                {mode === 'register' && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Já tem uma conta?{' '}
                        <button onClick={() => {setMode('login'); setError('');}} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                            Fazer Login
                        </button>
                    </p>
                )}

                {(mode === 'forgot' || isMasterMode) && (
                    <button onClick={() => {setMode('login'); setIsMasterMode(false); setError('');}} className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center justify-center gap-1 w-full">
                        Voltar para Login Padrão
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLogin;