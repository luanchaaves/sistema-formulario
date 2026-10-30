import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/shell";
import { UsersClient } from "@/components/users/users-client";

export const metadata = {
  title: "Usuários | FormFlow",
};

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Access Control: Admin only
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const rawUsers = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          forms: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const users = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as "ADMIN" | "EDITOR" | "VIEWER",
    isActive: u.active,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    _count: u._count,
  }));

  return (
    <DashboardShell user={user} breadcrumbs={[{ label: "Usuários", href: "/dashboard/users" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Gerenciamento de Usuários</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Administre os membros da equipe, atribua perfis de acesso e controle o status das contas.
          </p>
        </div>

        <UsersClient initialUsers={users} currentUserId={user.id} />
      </div>
    </DashboardShell>
  );
}
