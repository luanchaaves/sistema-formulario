"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
  Mail,
  Lock,
  User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    forms: number;
  };
}

interface UsersClientProps {
  initialUsers: UserItem[];
  currentUserId: string;
}

export function UsersClient({ initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EDITOR" as "ADMIN" | "EDITOR" | "VIEWER",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Edit Role Modal State
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">("EDITOR");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    if (!matchesRole) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar usuário");

      setUsers((prev) => [data.user, ...prev]);
      toast.success("Usuário criado com sucesso!");
      setIsCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "EDITOR" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!userToEdit) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/users/${userToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar perfil");

      setUsers((prev) =>
        prev.map((u) => (u.id === userToEdit.id ? { ...u, role: editRole } : u))
      );
      toast.success("Perfil do usuário atualizado!");
      setUserToEdit(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar usuário");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    if (user.id === currentUserId) {
      toast.error("Você não pode desativar sua própria conta");
      return;
    }

    const nextState = !user.isActive;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar status");

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextState } : u))
      );
      toast.success(`Usuário ${nextState ? "ativado" : "desativado"} com sucesso`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar status");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir usuário");

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success("Usuário excluído com sucesso");
      setUserToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir usuário");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <ShieldAlert className="w-3 h-3" />
            Administrador
          </span>
        );
      case "EDITOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-3 h-3" />
            Editor
          </span>
        );
      case "VIEWER":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Shield className="w-3 h-3" />
            Visualizador
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Role filter */}
          <div className="relative min-w-[180px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer"
            >
              <option value="all">Todos os perfis ({users.length})</option>
              <option value="ADMIN">Administradores</option>
              <option value="EDITOR">Editores</option>
              <option value="VIEWER">Visualizadores</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Create User Button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Usuário</th>
                <th className="py-3.5 px-4 font-semibold">Perfil</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Data de Cadastro</th>
                <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredUsers.map((u) => {
                const initials = u.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const isSelf = u.id === currentUserId;

                return (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-violet-500/20 shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-200 flex items-center gap-2">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-medium">
                                Você
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={isSelf}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          u.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-zinc-700/50"
                        } ${isSelf ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                        title={isSelf ? "Não é possível desativar a própria conta" : "Clique para alterar status"}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-zinc-400 whitespace-nowrap">
                      {format(new Date(u.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setUserToEdit(u);
                            setEditRole(u.role);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                          title="Alterar perfil"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {!isSelf && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Excluir usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create User */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Criar Novo Usuário</h3>
                  <p className="text-xs text-zinc-400">Adicione um novo membro com perfil de acesso específico</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="carlos@empresa.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Senha Provisória</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Mínimo de 8 caracteres"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Perfil de Acesso</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "ADMIN", title: "Administrador", desc: "Acesso total" },
                    { id: "EDITOR", title: "Editor", desc: "Cria e gerencia" },
                    { id: "VIEWER", title: "Visualizador", desc: "Apenas leitura" },
                  ].map((roleOpt) => (
                    <button
                      key={roleOpt.id}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, role: roleOpt.id as any })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        createForm.role === roleOpt.id
                          ? "bg-violet-600/10 border-violet-500/50 text-violet-300 ring-2 ring-violet-500/20"
                          : "bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="font-semibold text-xs">{roleOpt.title}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{roleOpt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isCreating ? "Criando..." : "Salvar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Role */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-zinc-100 mb-1">Alterar Perfil de Acesso</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Selecione o novo nível de permissão para o usuário <strong>{userToEdit.name}</strong>.
            </p>

            <div className="space-y-2 mb-6">
              {[
                {
                  id: "ADMIN",
                  title: "Administrador",
                  desc: "Controle completo de formulários, respostas, usuários e configurações globais.",
                },
                {
                  id: "EDITOR",
                  title: "Editor",
                  desc: "Pode criar, editar e publicar formulários, além de visualizar e excluir respostas.",
                },
                {
                  id: "VIEWER",
                  title: "Visualizador",
                  desc: "Apenas visualiza formulários e respostas autorizadas, sem permissão de alteração.",
                },
              ].map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    editRole === r.id
                      ? "bg-violet-500/10 border-violet-500/40 text-violet-200"
                      : "bg-zinc-800/30 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="editRole"
                    value={r.id}
                    checked={editRole === r.id}
                    onChange={() => setEditRole(r.id as any)}
                    className="mt-0.5 text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <div className="font-semibold text-xs text-zinc-200">{r.title}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToEdit(null)}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isUpdating ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Excluir Usuário</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente o usuário{" "}
              <strong className="text-zinc-200">"{userToDelete.name}"</strong> ({userToDelete.email})? Todas as sessões
              ativas deste usuário serão encerradas imediatamente.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
