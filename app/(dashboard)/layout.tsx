import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getUsuarioAutenticado();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6 pb-28 sm:max-w-xl lg:max-w-6xl lg:px-10 lg:py-10 lg:pb-16">
      {children}
    </main>
  );
}
