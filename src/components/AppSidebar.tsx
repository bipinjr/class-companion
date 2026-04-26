import { NavLink, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Users,
  TrendingUp,
  ClipboardList,
  FileText,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowCard } from "@/components/ui/spotlight-card";

const items = [
  { to: "/", label: "Weekly Planner", icon: CalendarDays },
  { to: "/attendance", label: "Attendance", icon: Users },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/assessments", label: "Assessments", icon: ClipboardList },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const location = useLocation();
  return (
    <aside className="hidden md:flex w-[280px] shrink-0 bg-black/40 backdrop-blur-md border-r border-white/10 text-sidebar-foreground flex-col h-screen sticky top-0 z-10">
      {/* Header with bottom divider */}
      <div className="px-4 py-5 flex items-center gap-3 border-b border-sidebar-border">
        <div
          className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#3B7FEB" }}
        >
          <Sparkles className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-[16px] font-semibold text-white truncate">Smart Assistant</p>
          <p className="text-[12px] text-sidebar-foreground/70 truncate">BCA · Single Class</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-4 py-4 flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              style={active ? { backgroundColor: "#3B7FEB" } : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[10px] text-[14px] font-medium transition-colors",
                "px-[14px] py-[10px]",
                active
                  ? "text-white"
                  : "text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/60"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Spotlight glow card filling empty space */}
      <GlowCard glowColor="blue" className="flex-1 my-4 mx-2 min-h-0" />

      {/* Footer version label */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-[11px] text-sidebar-foreground/50">v1.0 · Demo data seeded</p>
      </div>
    </aside>
  );
}
