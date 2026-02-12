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
        {/* Header Section */}
        <section className="border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--background))]">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-24 lg:py-28">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 space-y-1 sm:space-y-2">
                <h1 className="text-balance wrap-break-word text-xl font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl lg:text-4xl">
                  Confession review
                </h1>
                <p className="wrap-break-word text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
                  Approve or reject new submissions.
                </p>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <SignOutButton />
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-12 sm:px-6 sm:py-24">
          <AdminList />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
