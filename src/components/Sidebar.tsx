import { Link, useRoute } from "wouter";
import {
  LayoutDashboard,
  Users,
  FileText,
  PlusCircle,
  LogOut,
  Briefcase,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn, getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "My Clients" },
  { href: "/apply", icon: PlusCircle, label: "Apply for Client" },
  { href: "/applications", icon: FileText, label: "Applications" },
];

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const [active] = useRoute(href);
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </a>
    </Link>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Briefcase className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">Aplyease</p>
          <p className="text-xs text-muted-foreground">Employee Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
            {user ? getInitials(user.name) : "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-md hover:bg-accent lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-background shadow-xl">
            <div className="flex justify-end p-3">
              <button onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar className="border-r-0" />
          </div>
        </div>
      )}
    </>
  );
}
