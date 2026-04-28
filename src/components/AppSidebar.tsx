import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Users,
  TrendingUp,
  ClipboardList,
  FileText,
  Settings as SettingsIcon,
  Anchor,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowCard } from "@/components/ui/spotlight-card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/", label: "Weekly Planner", icon: CalendarDays },
  { to: "/attendance", label: "Attendance", icon: Users },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/assessments", label: "Assessments", icon: ClipboardList },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <>
      <div className="px-4 py-5 flex items-center gap-3 border-b border-sidebar-border">
        <div
          className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#3B7FEB" }}
        >
          <Anchor className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-[16px] font-semibold text-white truncate">Smart Assistant</p>
          <p className="text-[12px] text-sidebar-foreground/70 truncate">BCA · Single Class</p>
        </div>
      </div>

      <nav className="px-4 py-4 flex flex-col gap-1 flex-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <GlowCard key={to} glowColor="blue" className="!rounded-[10px]">
              <NavLink
                to={to}
                onClick={onNavigate}
                style={active ? { backgroundColor: "#3B7FEB" } : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] text-[14px] font-medium transition-colors relative z-[1]",
                  "px-[14px] py-[10px]",
                  active
                    ? "text-white"
                    : "text-sidebar-foreground/70 hover:text-white"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{label}</span>
              </NavLink>
            </GlowCard>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-[11px] text-sidebar-foreground/50">​</p>
      </div>
    </>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[280px] shrink-0 bg-black/50 backdrop-blur-sm border-r border-white/10 text-sidebar-foreground flex-col h-screen sticky top-0 z-10">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 px-4 flex items-center gap-3 bg-black/70 backdrop-blur-md border-b border-white/10">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] p-0 bg-black/90 backdrop-blur-md border-r border-white/10 text-sidebar-foreground flex flex-col"
          >
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#3B7FEB" }}
          >
            <Anchor className="h-4 w-4 text-white" strokeWidth={2.25} />
          </div>
          <p className="text-sm font-semibold text-white truncate">Smart Assistant</p>
        </div>
      </header>
    </>
  );
}
