"use client";

import { useState } from "react";
import {
  User,
  Lock,
  Palette,
  Server,
  Shield,
  CheckCircle2,
  Moon,
  Sun,
  Laptop,
  Save,
  Globe,
  Database,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

interface SettingsClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function SettingsClient({ user }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "system">("profile");

  // Profile form state
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // System form state
  const [platformName, setPlatformName] = useState("FormFlow");
  const [publicUrl, setPublicUrl] = useState(
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("A confirmação da nova senha não confere");
      return;
    }

    setIsSavingProfile(true);
    try {
      const payload: any = { name };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar perfil");

      toast.success("Perfil atualizado com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {[
          { id: "profile", label: "Meu Perfil", icon: User },
          { id: "appearance", label: "Aparência", icon: Palette },
          { id: "system", label: "Sistema & Infraestrutura", icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Profile */}
      {activeTab === "profile" && (
        <div className="max-w-2xl space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-6 backdrop-blur-sm">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Informações Pessoais</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Atualize seus dados de cadastro e credenciais de acesso
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">E-mail</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/40 text-zinc-400 text-sm cursor-not-allowed"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  O e-mail é fixo e vinculado à autenticação do sistema.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nível de Permissão</label>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{user.role}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">Alterar Senha</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Deixe em branco caso não queira alterar sua senha
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Senha Atual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Necessária apenas se for alterar a senha"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? "Salvando..." : "Salvar Alterações"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Appearance */}
      {activeTab === "appearance" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-6 backdrop-blur-sm">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Tema do Sistema</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escolha a paleta visual de sua preferência. A configuração é persistida no seu navegador.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "dark", label: "Tema Escuro", desc: "Tons de grafite e contraste suave", icon: Moon },
                { id: "light", label: "Tema Claro", desc: "Visual limpo e brilhante", icon: Sun },
                { id: "system", label: "Automático", desc: "Sincronizado com o sistema operacional", icon: Laptop },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-violet-600/10 border-violet-500 text-violet-300 ring-2 ring-violet-500/20"
                        : "bg-zinc-800/40 border-zinc-700/80 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2.5 text-violet-400" />
                    <div className="font-semibold text-sm text-zinc-200">{opt.label}</div>
                    <div className="text-xs text-zinc-400 mt-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: System */}
      {activeTab === "system" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-6 backdrop-blur-sm">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Configurações Globais da Plataforma</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Parâmetros de execução, domínio público e diagnóstico de infraestrutura
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nome da Plataforma</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">URL Pública da Aplicação</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={publicUrl}
                    onChange={(e) => setPublicUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Utilizada para gerar links públicos e códigos QR compartilháveis.
                </span>
              </div>
            </div>

            {/* Diagnostics Cards */}
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Status da Infraestrutura
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">PostgreSQL (Prisma)</div>
                      <div className="text-zinc-500 text-[11px]">Persistência Relacional</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Ativo
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-violet-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Cloudflare Tunnel</div>
                      <div className="text-zinc-500 text-[11px]">HTTPS & Zero Trust</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                    Pronto
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Next.js App Router</div>
                      <div className="text-zinc-500 text-[11px]">Produção Standalone</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    v16.4.3
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Proxmox VE (Ubuntu)</div>
                      <div className="text-zinc-500 text-[11px]">Docker Compose</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    Homologado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
