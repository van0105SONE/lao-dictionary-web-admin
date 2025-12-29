import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle,
  Users,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCurrentUser } from "@/app/hooks/use-current-user";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "admin", "editor"],
  },
  {
    path: "/admin/words",
    label: "Words",
    icon: BookOpen,
    roles: ["superadmin", "admin", "editor"],
  },
  {
    path: "/admin/correct-incorrect",
    label: "Correct/Incorrect",
    icon: CheckCircle,
    roles: ["superadmin", "admin", "editor"],
  },
  {
    path: "/admin/users",
    label: "Users",
    icon: Users,
    roles: ["superadmin"],
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header (only visible on small screens) */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-sky flex items-center justify-center shadow-soft">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Dictionary</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-card transition-transform duration-300 ease-in-out",
          "flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo & Title (Desktop & Mobile when open) */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-sky flex items-center justify-center shadow-soft">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Dictionary</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)} // Close on mobile after click
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User & Logout (Bottom) */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
              <span className="text-sm font-semibold text-accent-foreground">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email || "No name"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
