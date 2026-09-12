import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { Play, Bookmark, Star, LayoutGrid, ListVideo, PenLine, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface MockupCardProps {
  title: string;
  channel: string;
  duration: string;
  gradient: string;
  progress: number;
  rating: number;
  className?: string;
}

const MockupCard = ({ title, channel, duration, gradient, progress, rating, className = "" }: MockupCardProps) => (
  <div className={cn("group rounded-xl md:rounded-2xl border border-border/50 bg-background/80 backdrop-blur-sm overflow-hidden flex flex-col shadow-sm", className)}>
    <div className={cn("aspect-video w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br", gradient)}>
      <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors duration-500" />
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 motion-reduce:transform-none">
        <Play className="w-4 h-4 md:w-5 md:h-5 text-white ml-0.5" />
      </div>
      <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-1.5 py-0.5 rounded-md text-[10px] md:text-xs font-mono font-medium text-foreground border border-white/5">
        {duration}
      </div>
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-background/40 w-full backdrop-blur-sm">
          <div className="h-full bg-primary relative" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
          </div>
        </div>
      )}
    </div>
    <div className="p-3 md:p-4 flex flex-col gap-1.5">
      <h4 className="font-bold text-sm md:text-base text-foreground line-clamp-1 leading-tight">{title}</h4>
      <p className="text-xs md:text-sm text-muted-foreground font-medium">{channel}</p>
      {rating > 0 && (
        <div className="flex items-center gap-0.5 mt-1">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className={cn("w-3 h-3 md:w-3.5 md:h-3.5", i <= rating ? 'fill-primary text-primary' : 'text-muted/30')} />
          ))}
        </div>
      )}
    </div>
  </div>
);

const ProductMockup = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 md:mt-24 mb-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[80%] h-[80%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative rounded-2xl md:rounded-[2rem] border border-border/60 bg-card/80 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col md:flex-row h-[500px] md:h-[650px] ring-1 ring-white/5">
        
        <div className="absolute top-0 left-0 w-full h-12 bg-background/50 backdrop-blur-md border-b border-border/50 flex items-center px-4 gap-2 z-30 md:hidden">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>

        <div className="hidden md:flex w-64 bg-background/50 border-r border-border/50 flex-col py-6 relative z-20">
          <div className="flex items-center gap-2 px-6 mb-8">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          
          <div className="px-4 space-y-1 mb-8">
            <div className="px-3 py-2 text-sm font-semibold bg-primary/10 text-primary rounded-lg flex items-center gap-3">
              <ListVideo className="w-4 h-4" /> All Saved
            </div>
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-3 transition-colors">
              <Play className="w-4 h-4" /> Watch Next
            </div>
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-3 transition-colors">
              <Star className="w-4 h-4" /> Favorites
            </div>
          </div>
          
          <div className="px-4">
            <div className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Playlists</div>
            <div className="space-y-1">
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-emerald-500" /> React Patterns
              </div>
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-blue-500" /> System Design
              </div>
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-orange-500" /> Rust Basics
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-transparent p-6 md:p-10 pt-16 md:pt-10 overflow-hidden flex flex-col gap-6 md:gap-8 relative z-20">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">All Saved</h3>
              <p className="text-sm md:text-base text-muted-foreground mt-1">12 tutorials</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-3 py-1.5 text-sm text-muted-foreground">
              <Search className="w-4 h-4" /> Search library...
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             <MockupCard 
               title="Advanced React Patterns" 
               channel="Frontend Mastery"
               duration="14:20"
               gradient="from-blue-600/30 to-purple-600/30"
               progress={100}
               rating={5}
             />
             <MockupCard 
               title="Node.js Event Loop" 
               channel="Backend Deep Dive"
               duration="45:00"
               gradient="from-emerald-600/30 to-teal-600/30"
               progress={30}
               rating={0}
             />
             <MockupCard 
               title="CSS Grid Layouts" 
               channel="Design UI"
               duration="22:15"
               gradient="from-orange-600/30 to-red-600/30"
               progress={0}
               rating={0}
               className="hidden sm:flex"
             />
             <MockupCard 
               title="Rust Memory Management" 
               channel="Systems Pro"
               duration="31:10"
               gradient="from-rose-600/30 to-pink-600/30"
               progress={0}
               rating={0}
               className="hidden lg:flex"
             />
             <MockupCard 
               title="Docker for Beginners" 
               channel="DevOps Weekly"
               duration="18:45"
               gradient="from-cyan-600/30 to-blue-600/30"
               progress={80}
               rating={4}
               className="hidden lg:flex"
             />
          </div>
          
          <div className="absolute bottom-6 md:bottom-10 right-6 md:right-10 w-72 md:w-80 bg-background/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-5 transform -rotate-2 hover:rotate-0 transition-transform duration-500 hidden sm:block motion-reduce:transform-none">
            <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-lg">
              Example Note
            </div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <PenLine className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Notes on</div>
                <div className="text-sm font-bold leading-tight line-clamp-1">Advanced React Patterns</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-foreground/90 leading-relaxed font-medium">
                <span className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded text-xs mr-2 border border-primary/20">12:45</span>
                Compound components make the API so much cleaner. Need to refactor the dashboard using this pattern tomorrow.
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 md:top-4 md:right-4 z-40">
          <div className="bg-background/80 backdrop-blur-md text-xs font-semibold px-3 py-1.5 rounded-bl-xl md:rounded-lg border-b border-l md:border border-border/50 text-muted-foreground shadow-sm">
            Example Interface
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Landing() {
  const features = [
    {
      title: "Intentional watching",
      description: "Move away from algorithm-driven feeds. Save the tutorials that matter to your own distraction-free library.",
      icon: Bookmark
    },
    {
      title: "Time-stamped insights",
      description: "Write notes while you watch. Capture the exact moments that made concepts click so you never have to search for them again.",
      icon: PenLine
    },
    {
      title: "Organize by topic",
      description: "Group videos into custom playlists. Build your own curriculum for mastering a new framework or learning a new language.",
      icon: LayoutGrid
    }
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background selection:bg-primary/30 motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none">
      <header className="w-full h-16 md:h-20 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center justify-center px-4 md:px-8 fixed top-0 z-50 transition-all">
        <div className="w-full max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold text-foreground tracking-tight">
            <img src={`${import.meta.env.BASE_URL}cortado-logo.png`} alt="Cortado" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
            Cortado
          </div>
          <div className="flex items-center gap-1 md:gap-4">
            <Link 
              href="/sign-in" 
              className={cn(buttonVariants({ variant: "ghost" }), "inline-flex font-semibold hover:bg-secondary rounded-xl text-sm md:text-base px-2 md:px-6")}
            >
              Log in
            </Link>
            <Link 
              href="/sign-up" 
              className={cn(buttonVariants(), "rounded-xl font-bold shadow-lg shadow-primary/20 text-sm md:text-base px-5 md:px-6 h-9 md:h-11")}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-32 md:pt-48 pb-10">
        <section className="w-full max-w-5xl mx-auto text-center flex flex-col items-center px-4">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Stop losing track of good videos
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter text-foreground mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-[1.05] md:leading-[1.05]">
            Build your personal <br className="hidden md:block" />
            <span className="text-gradient">learning library.</span>
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-medium leading-relaxed">
            Save YouTube tutorials, take meaningful notes, rate your watches, and curate custom lists that actually help you learn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link 
              href="/sign-up" 
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto rounded-xl text-lg font-bold h-14 px-8 shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all")}
            >
              Start your library
            </Link>
          </div>
        </section>

        <section className="w-full max-w-7xl mx-auto px-4 pb-20 md:pb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <ProductMockup />
        </section>

        <section className="w-full border-t border-border/50 bg-background/50">
          <div className="max-w-6xl mx-auto px-4 py-24 md:py-32">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">Learn with purpose.</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                Cortado gives you the tools to turn passive watching into active learning.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {features.map((f, i) => (
                <div key={i} className="flex flex-col items-center text-center p-8 rounded-[2rem] bg-card/30 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 text-primary shadow-inner">
                    <f.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full max-w-4xl mx-auto px-4 py-24 md:py-40 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-8">
            Ready to focus?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl mx-auto font-medium">
            Join Cortado today and start building the curated learning library you deserve.
          </p>
          <Link 
            href="/sign-up" 
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto rounded-xl text-lg font-bold h-14 px-10 shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all")}
          >
            Get Started for Free
          </Link>
        </section>
      </main>

      <footer className="w-full border-t border-border/50 py-8 px-4 md:px-8 text-center bg-background mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <img src={`${import.meta.env.BASE_URL}cortado-logo.png`} alt="Cortado" className="w-6 h-6 object-contain opacity-80" />
            Cortado
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            &copy; {new Date().getFullYear()} Cortado. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
