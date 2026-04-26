import { AppSidebar } from "./AppSidebar";
import CinematicThemeSwitcher from "./ui/cinematic-theme-switcher";
import { AnimatedBackground } from "./ui/background-paper-shaders";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-transparent relative">
      <AnimatedBackground />
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-auto relative">
        <div className="absolute top-4 right-6 z-40">
          <CinematicThemeSwitcher />
        </div>
        {children}
      </main>
    </div>
  );
}
