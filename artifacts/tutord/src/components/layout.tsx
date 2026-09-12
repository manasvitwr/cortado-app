import { Link, useLocation } from "wouter";
import { Home, Compass, PlusCircle, Bell, User, LayoutList } from "lucide-react";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/add", icon: PlusCircle, label: "Add" },
    { href: "/lists", icon: LayoutList, label: "Lists" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background items-center w-full">
      {/* Desktop Header */}
      <header className="hidden md:flex w-full h-16 border-b border-border bg-background/80 backdrop-blur items-center justify-center sticky top-0 z-50">
        <div className="w-full max-w-screen-md px-6 flex justify-between items-center">
          <Link href="/home" className="text-xl font-bold text-primary flex items-center gap-2">
            <img src="/logo.svg" alt="Tutord Logo" className="w-6 h-6" />
            Tutord
          </Link>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2 rounded-full px-4">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-screen-md px-4 md:px-6 py-6 pb-24 md:pb-8 flex flex-col relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] border-t border-border bg-background/90 backdrop-blur z-50 flex items-center justify-around pb-safe px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          if (item.href === "/add") {
            return (
              <Link key={item.href} href={item.href} className="relative -top-4">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
                  isActive ? "bg-primary text-primary-foreground" : "bg-card border-2 border-border text-primary"
                )}>
                  <Icon className="w-7 h-7" />
                </div>
              </Link>
            );
          }
          
          return (
            <Link key={item.href} href={item.href} className="flex-1 h-full">
              <Button variant="nav" data-active={isActive} className="w-full h-full rounded-none">
                <Icon className={cn("w-6 h-6 mb-1 transition-all", isActive && "scale-110")} />
                <span className="text-[10px] font-medium opacity-0 md:opacity-100 hidden">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}