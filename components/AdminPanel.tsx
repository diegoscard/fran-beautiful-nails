import React, { useEffect, useState } from 'react';
import { Shield, Search, Users, Calendar, Pencil, X, Save, KeyRound, Mail, User as UserIcon, Send, CheckSquare, Square, Briefcase, Trash2, Check } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { User, UserRole } from '../types';

const PERMISSIONS_LIST = [
    { id: 'agenda', label: 'Agenda de Serviços' },
    { id: 'list', label: 'Histórico de Atendimentos' },
    { id: 'cashflow', label: 'Fluxo de Caixa (Financeiro)' },
    { id: 'dashboard', label: 'Dashboard / Gráficos' },
];

const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para Edição
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState<UserRole>('employee');
    const [editPermissions, setEditPermissions] = useState<string[]>([]);
    
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    // Estado para confirmação de exclusão inline
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        const storedUsers = localStorage.getItem('niel_app_users_v1');
        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditRole(user.role || (user.isAdmin ? 'admin' : 'employee'));
        setEditPermissions(user.permissions || ['agenda']);
        setNewPassword('');
        setShowPasswordSection(false);
        setDeleteConfirmationId(null); // Fecha confirmação de exclusão se estiver aberta
    };

    const confirmDeleteUser = (userId: string) => {
        const storedUsersStr = localStorage.getItem('niel_app_users_v1');
        if (storedUsersStr) {
            const dbUsers = JSON.parse(storedUsersStr);
            const updatedUsers = dbUsers.filter((u: any) => u.id !== userId);
            localStorage.setItem('niel_app_users_v1', JSON.stringify(updatedUsers));
            setUsers(updatedUsers);
        }
        setDeleteConfirmationId(null);
    };

    const togglePermission = (permId: string) => {
        if (editPermissions.includes(permId)) {
            setEditPermissions(editPermissions.filter(p => p !== permId));
        } else {
            setEditPermissions([...editPermissions, permId]);
        }
    };

    const handleGeneratePassword = () => {
        const randomPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
        setNewPassword(randomPass);
    };

    const handleSendEmail = () => {
        if (!newPassword) return;
        
        const subject = encodeURIComponent("Redefinição de Senha - Niel Design System");
        const body = encodeURIComponent(`Olá ${editName},\n\nSua senha foi redefinida com sucesso pelo administrador.\n\nSua nova senha é: ${newPassword}\n\nPor favor, acesse o sistema e altere sua senha se desejar.\n\nAtenciosamente,\nEquipe Niel Design`);
        
        window.location.href = `mailto:${editEmail}?subject=${subject}&body=${body}`;
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editingUser) return;

        // 1. Recuperar banco de dados atualizado
        const storedUsersStr = localStorage.getItem('niel_app_users_v1');
        if (!storedUsersStr) return;
        
        let dbUsers = JSON.parse(storedUsersStr);

        // 2. Atualizar o usuário específico
        dbUsers = dbUsers.map((u: any) => {
            if (u.id === editingUser.id) {
                const updatedUser = {
                    ...u,
                    name: editName,
                    email: editEmail,
                    role: editRole,
                    isAdmin: editRole === 'admin' || editRole === 'master',
                    permissions: editRole === 'employee' ? editPermissions : ['agenda', 'list', 'cashflow', 'dashboard', 'admin']
                };
                
                // Se definiu nova senha, atualiza também
                if (newPassword.trim() !== '') {
                    updatedUser.password = newPassword;
                }
                return updatedUser;
            }
            return u;
        });

        // 3. Salvar volta no LocalStorage
        localStorage.setItem('niel_app_users_v1', JSON.stringify(dbUsers));

        // 4. Atualizar estado local
        setUsers(dbUsers);
        
        // 5. Fechar modal e limpar
        setEditingUser(null);
        alert('Dados do usuário atualizados com sucesso!');
    };

    const getRoleBadge = (role?: string) => {
        switch(role) {
            case 'master': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">MASTER</span>;
            case 'admin': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">ADMIN</span>;
            default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">FUNCIONÁRIO</span>;
        }
    };

    return (
        <div className="w-full">
            <div className="animate-fade-in-up">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            <Users className="w-5 h-5 text-indigo-500" />
                            <span className="font-bold text-lg">{users.length}</span>
                            <span className="text-slate-400">usuários registrados</span>
                        </div>
                        
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Buscar por nome ou e-mail..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuário</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cargo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">E-mail</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Cadastro</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800 dark:text-white">{user.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.id.slice(0,8)}...</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(user.role || (user.isAdmin ? 'admin' : 'employee'))}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(user.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {/* Master não pode ser editado ou excluído aqui para segurança básica */}
                                                {user.role !== 'master' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        {deleteConfirmationId === user.id ? (
                                                            <div className="flex items-center bg-red-50 dark:bg-red-900/20 rounded-md p-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                                                <span className="text-[10px] text-red-600 dark:text-red-400 font-bold mr-2 ml-1">Excluir?</span>
                                                                <button 
                                                                    onClick={() => confirmDeleteUser(user.id)} 
                                                                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded transition-colors mr-1"
                                                                    title="Confirmar"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setDeleteConfirmationId(null)} 
                                                                    className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                                                    title="Cancelar"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleEditClick(user)}
                                                                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                                    title="Editar Usuário"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setDeleteConfirmationId(user.id)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                                    title="Excluir Usuário"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL DE EDIÇÃO */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-indigo-500" />
                                Gerenciar Acessos
                            </h3>
                            <button 
                                onClick={() => setEditingUser(null)} 
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Nome</label>
                                    <input 
                                        type="text" 
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Cargo</label>
                                    <select
                                        value={editRole}
                                        onChange={e => setEditRole(e.target.value as UserRole)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="employee">Funcionário</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">E-mail</label>
                                <input 
                                    type="email" 
                                    value={editEmail}
                                    onChange={e => setEditEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {/* SEÇÃO DE PERMISSÕES (Só aparece se for Funcionário) */}
                            {editRole === 'employee' && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-3">
                                        Permissões de Acesso
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {PERMISSIONS_LIST.map((perm) => {
                                            const isChecked = editPermissions.includes(perm.id);
                                            return (
                                                <div 
                                                    key={perm.id}
                                                    onClick={() => togglePermission(perm.id)}
                                                    className={`cursor-pointer flex items-center gap-2 p-2 rounded border transition-all ${
                                                        isChecked 
                                                        ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' 
                                                        : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-600'
                                                    }`}
                                                >
                                                    {isChecked ? (
                                                        <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-slate-300 dark:text-slate-500" />
                                                    )}
                                                    <span className={`text-sm ${isChecked ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {perm.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Selecione quais áreas do sistema este funcionário pode visualizar.
                                    </p>
                                </div>
                            )}

                            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                    <KeyRound className="w-4 h-4" />
                                    {showPasswordSection ? 'Cancelar redefinição de senha' : 'Redefinir Senha do Usuário'}
                                </button>

                                {showPasswordSection && (
                                    <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 animate-in slide-in-from-top-2">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-2">Nova Senha</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-500 dark:bg-slate-600 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="Digite ou gere nova senha"
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleGeneratePassword}
                                                className="px-3 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                                title="Gerar Aleatória"
                                            >
                                                Gerar
                                            </button>
                                        </div>
                                        {newPassword && (
                                            <div className="mt-2">
                                                <button 
                                                    type="button"
                                                    onClick={handleSendEmail}
                                                    className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    <Send className="w-4 h-4" />
                                                    Enviar Senha por E-mail
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
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
            )}
        </div>
    );
};

export default AdminPanel;