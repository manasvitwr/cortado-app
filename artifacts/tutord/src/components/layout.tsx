import { Link, useLocation } from "wouter";
import { Home, Compass, Plus, LayoutList, User } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/add", icon: Plus, label: "Add" },
    { href: "/lists", icon: LayoutList, label: "Lists" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background items-center w-full">
      {/* Desktop Header */}
      <header className="hidden md:flex w-full h-20 border-b border-border bg-background/80 backdrop-blur-xl items-center justify-center sticky top-0 z-50">
        <div className="w-full max-w-screen-md px-6 flex justify-between items-center">
          <Link href="/home" className="text-xl font-bold text-primary flex items-center gap-2 tracking-tight">
            <img src="/logo.svg" alt="Tutord" className="w-6 h-6" />
            Tutord
          </Link>
          <nav className="flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border shadow-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2 rounded-xl px-4 font-medium transition-all">
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
      <main className="flex-1 w-full max-w-screen-md px-4 md:px-6 py-6 pb-28 md:pb-8 flex flex-col relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Floating Pill */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 h-[64px] border border-border/50 bg-card/90 backdrop-blur-xl z-50 flex items-center justify-around px-2 rounded-[2rem] w-[calc(100%-2rem)] max-w-sm shadow-2xl shadow-black/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          if (item.href === "/add") {
            return (
              <Link key={item.href} href={item.href} className="relative z-10 flex items-center justify-center -top-4">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border-[4px] border-background",
                  isActive ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-card border-border text-primary"
                )}>
                  <Icon className="w-6 h-6" strokeWidth={3} />
                </div>
              </Link>
            );
          }
          
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex justify-center items-center h-full">
              <button className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all", isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground")}>
                <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}