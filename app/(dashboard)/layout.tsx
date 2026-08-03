import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getUsuarioAutenticado();
  if (!user) redirect("/login");

  return children;
}
