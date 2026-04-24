import { NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  Users,
  TrendingUp,
  ClipboardList,
  FileText,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Weekly Planner", icon: Calendar },
  { to: "/attendance", label: "Attendance", icon: Users },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/assessments", label: "Assessments", icon: ClipboardList },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const location = useLocation();
  return (
    <aside className="hidden md:flex w-60 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-col">
      <div className="px-5 py-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-accent-foreground">Smart Assistant</p>
          <p className="text-[11px] text-sidebar-foreground/70">BCA · Single Class</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="font-medium">{label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[11px] text-sidebar-foreground/60">v1.0 · Demo data seeded</p>
      </div>
    </aside>
  );
}
