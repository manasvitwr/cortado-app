import { Layout } from "@/components/layout";
import { useGetDashboard } from "@workspace/api-client-react";
import { VideoCard, VideoCardSkeleton } from "@/components/video-card";
import { ListCard, ListCardSkeleton } from "@/components/list-card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui";

export default function Home() {
  const { data, isLoading, error } = useGetDashboard();

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 bg-card rounded-[2rem] border border-border p-8 text-center mt-10">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2 tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground font-medium">We couldn't load your dashboard. Please try refreshing.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in duration-500 pb-10">
        <header className="pt-4 px-2">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-10 w-64 bg-secondary rounded-xl animate-pulse" />
              <div className="h-5 w-48 bg-secondary/50 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-1">
                {data?.greeting}
              </h1>
              <p className="text-muted-foreground font-medium text-sm sm:text-base">
                Review or track tutorials you've watched...
              </p>
            </>
          )}
        </header>

        {/* Watchlist */}
        <section className="px-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Your Watchlist</h2>
            <Link href="/profile"><span className="text-sm font-bold text-primary hover:underline cursor-pointer">See All</span></Link>
          </div>
          
          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[280px] sm:w-[320px] shrink-0 snap-center"><VideoCardSkeleton /></div>
              ))
            ) : data?.watchlist && data.watchlist.length > 0 ? (
              data.watchlist.map((entry) => (
                <div key={entry.id} className="w-[280px] sm:w-[320px] shrink-0 snap-center">
                  <VideoCard entry={entry} />
                </div>
              ))
            ) : (
              <div className="w-full bg-card/50 border border-border border-dashed rounded-[2rem] p-8 text-center flex flex-col items-center">
                <p className="text-muted-foreground font-medium mb-4">Nothing in your watchlist right now.</p>
                <Link href="/add">
                  <Button variant="secondary" className="rounded-xl font-bold">Add a Tutorial</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Cortado community discovery */}
        <section className="px-2">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Trending on Cortado</h2>
              <p className="text-xs text-muted-foreground mt-1">Public saves, ratings, and freshness — not YouTube-wide views.</p>
            </div>
            <Link href="/explore"><span className="text-sm font-bold text-primary hover:underline cursor-pointer">Explore</span></Link>
          </div>
          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[160px] sm:w-[200px] shrink-0 snap-center"><VideoCardSkeleton /></div>
              ))
            ) : data?.popularThisMonth && data.popularThisMonth.length > 0 ? data.popularThisMonth.map((entry) => (
              <div key={entry.id} className="w-[160px] sm:w-[200px] shrink-0 snap-center">
                <VideoCard entry={entry} compact />
              </div>
            )) : (
              <div className="w-full rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No public Cortado activity yet.</p>
                <Link href="/explore"><span className="text-sm font-bold text-primary hover:underline cursor-pointer">See editorial picks in Explore</span></Link>
              </div>
            )}
          </div>
        </section>

        {/* Curated Lists */}
        <section className="px-2">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Curated Lists for You</h2>
              <p className="text-xs text-muted-foreground mt-1">Public community lists ranked from your interests and saved topics.</p>
            </div>
            <Link href="/explore"><span className="text-sm font-bold text-primary hover:underline cursor-pointer">See All</span></Link>
          </div>
          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[280px] sm:w-[320px] shrink-0 snap-center"><ListCardSkeleton /></div>
              ))
            ) : data?.popularLists && data.popularLists.length > 0 ? data.popularLists.map((list) => (
              <div key={list.id} className="w-[280px] sm:w-[320px] shrink-0 snap-center">
                <ListCard playlist={list} />
              </div>
            )) : (
              <div className="w-full rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No public community lists yet.</p>
                <Link href="/explore"><span className="text-sm font-bold text-primary hover:underline cursor-pointer">Browse Explore</span></Link>
              </div>
            )}
          </div>
        </section>

      </div>
    </Layout>
  );
}
