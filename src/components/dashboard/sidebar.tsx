"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Users,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Role } from "@prisma/client";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Sessão finalizada com sucesso");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Erro ao encerrar sessão");
    }
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      title: "Formulários",
      href: "/dashboard/forms",
      icon: FileText,
      active: pathname.startsWith("/dashboard/forms"),
    },
    {
      title: "Respostas",
      href: "/dashboard/responses",
      icon: Inbox,
      active: pathname.startsWith("/dashboard/responses"),
    },
    ...(user.role === Role.ADMIN
      ? [
          {
            title: "Usuários",
            href: "/dashboard/users",
            icon: Users,
            active: pathname.startsWith("/dashboard/users"),
          },
        ]
      : []),
    {
      title: "Configurações",
      href: "/dashboard/settings",
      icon: Settings,
      active: pathname.startsWith("/dashboard/settings"),
    },
  ];

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const themeIcon =
    theme === "dark" ? (
      <Moon className="w-4 h-4 text-indigo-400" />
    ) : theme === "light" ? (
      <Sun className="w-4 h-4 text-amber-500" />
    ) : (
      <Laptop className="w-4 h-4 text-zinc-400" />
    );

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-3.5 select-none">
      {/* Brand logo & collapse toggle */}
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800/80">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                  FormFlow
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold">
                  Enterprise
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  item.active
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100"
                } ${collapsed ? "justify-center px-2" : ""}`}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer controls: theme toggle & user badge */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2">
        {/* Theme button */}
        <button
          onClick={cycleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors ${
            collapsed ? "justify-center px-2" : ""
          }`}
          title={`Tema: ${theme}`}
        >
          {themeIcon}
          {!collapsed && (
            <span className="capitalize">
              Tema: {theme === "dark" ? "Escuro" : theme === "light" ? "Claro" : "Sistema"}
            </span>
          )}
        </button>

        {/* User profile & logout */}
        <div
          className={`flex items-center justify-between p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 ${
            collapsed ? "flex-col gap-2 p-1.5" : ""
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-white/10">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200">
                  {user.name}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                  {user.role}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Sair do sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 z-30 shrink-0 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
