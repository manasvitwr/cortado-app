import { Link } from "wouter";
import { Button } from "@/components/ui";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="w-full h-20 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-center px-4 md:px-8 fixed top-0 z-50">
        <div className="w-full max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-3 text-2xl font-bold text-foreground tracking-tight">
            <img src="/cortado-logo.png" alt="Cortado" className="w-8 h-8 object-contain" />
            Cortado
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-semibold hover:bg-secondary rounded-xl text-base px-6">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="rounded-xl font-bold shadow-lg shadow-primary/20 text-base px-6 h-11">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-32 pb-20 px-4">
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto text-center flex flex-col items-center mt-10 md:mt-20">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Stop losing track of good videos.
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-foreground mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-[1.1]">
            Build your personal <br className="hidden md:block" />
            <span className="text-gradient">learning library.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-medium">
            Save YouTube tutorials, take meaningful notes, rate your watches, and curate custom lists that actually help you learn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto rounded-xl text-lg font-bold h-14 px-8 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all">
                Start your library
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature showcase mockup */}
        <div className="w-full aspect-[16/10] max-w-5xl mt-24 md:mt-32 relative rounded-[2rem] border border-border bg-card shadow-2xl overflow-hidden shadow-primary/5 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-20">
            <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl w-full max-w-md transform -rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-secondary rounded-xl overflow-hidden shadow-inner border border-border">
                  <img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg tracking-tight">Advanced React Patterns</h3>
                  <p className="text-sm text-primary font-medium mt-0.5">Watched • Rated 5/5</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed font-medium">
                "Finally clicked. The section on compound components at 14:20 is pure gold. Need to refactor the dashboard using this."
              </p>
            </div>
            
            <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl w-full max-w-md transform translate-x-24 rotate-3 mt-[-40px] hover:rotate-0 transition-all duration-500 hover:scale-105 hidden md:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-secondary rounded-xl overflow-hidden shadow-inner border border-border">
                  <img src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg tracking-tight">Node.js Performance</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">Watchlist</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed font-medium italic">
                Saved to "Backend Mastery" list.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
