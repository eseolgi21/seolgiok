import { auth } from "@/lib/auth/auth";
import { USER_LEVELS } from "@/lib/constants/user-levels";
import HandoverAdminView from "./HandoverAdminView";

export default async function HandoverAdminPage() {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  const isAdmin = level >= USER_LEVELS.ADMIN;

  return <HandoverAdminView isAdmin={isAdmin} />;
}
