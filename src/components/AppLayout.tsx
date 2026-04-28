import { AppSidebar } from "./AppSidebar";
import { Starfield } from "./ui/starfield-1";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-transparent relative">
      <div className="fixed inset-0 -z-10 bg-black">
        <Starfield
          starColor="rgba(255,255,255,0.7)"
          bgColor="rgba(0,0,0,1)"
          speed={0.8}
          quantity={400}
        />
      </div>
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-auto relative pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
