import { Link, useLocation } from "wouter";
import { Home, Compass, Plus, LayoutList, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetProfile } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: profile } = useGetProfile();
  const { signOut } = useClerk();

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/add", icon: Plus, label: "Add" },
    { href: "/lists", icon: LayoutList, label: "Lists" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-background w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-border bg-background sticky top-0 h-[100dvh] overflow-y-auto px-6 py-8">
        <Link href="/home" className="flex items-center gap-3 text-xl font-bold text-foreground mb-12 tracking-tight transition-opacity hover:opacity-80">
          <img src="/cortado-logo.png" alt="Cortado" className="w-8 h-8 object-contain" />
          Cortado
        </Link>

        {profile && (
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary shrink-0 border border-border">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-base text-foreground truncate">{profile.displayName}</p>
              <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
            </div>
          </div>
        )}

        {profile && (
          <div className="flex gap-2 mb-8">
            <div className="flex-1 rounded-xl border border-border bg-card py-2 px-3 text-center">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Videos</p>
              <p className="font-bold text-sm text-foreground">{profile.stats.videosSaved}</p>
            </div>
            <div className="flex-1 rounded-xl border border-border bg-card py-2 px-3 text-center">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Lists</p>
              <p className="font-bold text-sm text-foreground">{profile.stats.playlistsCreated}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground font-medium"
                )}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-muted-foreground hover:bg-secondary hover:text-foreground font-medium mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 pb-28 md:pb-8 flex flex-col relative min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between mb-6 pt-2">
          <Link href="/home" className="flex items-center gap-2 text-lg font-bold text-foreground tracking-tight">
            <img src="/cortado-logo.png" alt="Cortado" className="w-6 h-6 object-contain" />
            Cortado
          </Link>
          {profile && (
            <Link href="/profile">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary border border-border">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Link>
          )}
        </header>

        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 backdrop-blur-xl z-50 flex items-center justify-around px-2 h-16 pb-safe shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          if (item.href === "/add") {
            return (
              <Link key={item.href} href={item.href} className="relative z-10 flex items-center justify-center -mt-6">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg",
                  isActive ? "bg-primary text-primary-foreground shadow-primary/30" : "bg-card border border-border text-primary"
                )}>
                  <Icon className="w-6 h-6" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }
          
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col justify-center items-center h-full gap-1 pt-1">
              <Icon className={cn("w-5 h-5 transition-transform", isActive ? "text-primary scale-110" : "text-muted-foreground")} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
