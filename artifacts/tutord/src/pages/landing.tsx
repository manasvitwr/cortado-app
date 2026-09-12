import { Link } from "wouter";
import { Button } from "@/components/ui";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="w-full h-16 border-b border-border bg-background/80 backdrop-blur flex items-center justify-center px-4 md:px-6 fixed top-0 z-50">
        <div className="w-full max-w-5xl flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl font-bold text-primary">
            <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
            Tutord
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-medium">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="rounded-full">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          Your personal learning library
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Save, rate, and master <br className="hidden md:block" />
          <span className="text-gradient">YouTube tutorials.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Stop losing track of good videos. Curate your own learning paths, take meaningful notes, and build a library of knowledge that's actually useful.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto rounded-full text-base">
              Start building your library
            </Button>
          </Link>
        </div>

        {/* Feature showcase mockup */}
        <div className="w-full aspect-[16/10] max-w-4xl mt-20 relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden shadow-primary/10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="absolute inset-0 bg-gradient-to-tr from-background to-transparent pointer-events-none z-10" />
          <img 
            src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&q=80" 
            alt="Interface preview" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl w-[90%] max-w-sm z-20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <img src="/logo.svg" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">React Patterns 2024</h3>
                <p className="text-sm text-white/60">Watched • Rated 5/5</p>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              "Great explanation of custom hooks. Remember to always use useMemo for complex object dependencies."
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}