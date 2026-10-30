import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/shell";
import { SettingsClient } from "@/components/settings/settings-client";

export const metadata = {
  title: "Configurações | FormFlow",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user} breadcrumbs={[{ label: "Configurações", href: "/dashboard/settings" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Configurações</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Personalize seu perfil, preferências de exibição e visualize os parâmetros da plataforma.
          </p>
        </div>

        <SettingsClient
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }}
        />
      </div>
    </DashboardShell>
  );
}
