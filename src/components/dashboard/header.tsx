"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, ChevronRight } from "lucide-react";

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  setMobileOpen: (open: boolean) => void;
}

export function Header({ user, setMobileOpen }: HeaderProps) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0 || (parts.length === 1 && parts[0] === "dashboard")) {
      return [{ label: "Dashboard", href: "/dashboard" }];
    }

    const items = [{ label: "Início", href: "/dashboard" }];
    if (parts.includes("forms")) {
      items.push({ label: "Formulários", href: "/dashboard/forms" });
      if (parts.length > 2) {
        items.push({ label: "Editor", href: pathname });
      }
    } else if (parts.includes("responses")) {
      items.push({ label: "Respostas", href: "/dashboard/responses" });
    } else if (parts.includes("users")) {
      items.push({ label: "Usuários", href: "/dashboard/users" });
    } else if (parts.includes("settings")) {
      items.push({ label: "Configurações", href: "/dashboard/settings" });
    }
    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between z-20 shrink-0">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
          title="Abrir navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href + idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Quick Action Button & User Info */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/forms/new"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Criar Formulário</span>
        </Link>

        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
