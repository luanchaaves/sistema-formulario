import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, invalidateSession, getCurrentUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await invalidateSession(token);
    }

    if (user) {
      await createAuditLog({
        userId: user.id,
        action: "USER_LOGOUT",
        entityType: "User",
        entityId: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Erro ao processar logout" }, { status: 500 });
  }
}
