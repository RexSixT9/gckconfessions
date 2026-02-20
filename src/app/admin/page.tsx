import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import AdminList from "@/components/admin/AdminList";
import SignOutButton from "@/components/admin/SignOutButton";
import Footer from "@/components/Footer";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/adminlogin");
  }

  try {
    const payload = await verifyAdminToken(token);
    if (!payload.sub) {
      redirect("/adminlogin");
    }
  } catch {
    redirect("/adminlogin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

          {/* Page header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-2xl">
                Confession review
              </h1>
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                Approve or reject new submissions
              </p>
            </div>
            <SignOutButton />
          </div>

          <AdminList />
        </div>
      </main>
      <Footer />
    </div>
  );
}
