import { Layout } from "@/components/layout";
import { VideoCard, VideoCardSkeleton } from "@/components/video-card";
import { ListCard, ListCardSkeleton } from "@/components/list-card";
import { useGetDashboard } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const { data, isLoading, error } = useGetDashboard();

  return (
    <Layout>
      {isLoading ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div>
            <div className="h-8 w-48 bg-secondary rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-64 bg-secondary rounded-lg animate-pulse" />
          </div>
          <section>
            <div className="h-6 w-32 bg-secondary rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <VideoCardSkeleton key={i} />)}
            </div>
          </section>
        </div>
      ) : error || !data ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card rounded-[2rem] border border-border shadow-xl">
          <p className="text-destructive font-medium mb-2">Could not load dashboard</p>
          <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-500">
          <header className="px-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{data.greeting}</h1>
            <p className="text-muted-foreground mt-1 font-medium">Ready to learn something new today?</p>
          </header>

          {data.watchlist.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xl font-bold tracking-tight">Continue Watching</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3">
                {data.watchlist.slice(0, 4).map(entry => (
                  <div className="w-[260px] shrink-0 snap-center sm:w-auto" key={entry.id}>
                    <VideoCard entry={entry} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.recentlyAdded.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xl font-bold tracking-tight">Recently Added</h2>
                <Link href="/profile" className="text-sm text-primary hover:underline flex items-center font-semibold">
                  See all <ChevronRight className="w-4 h-4 ml-0.5" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3">
                {data.recentlyAdded.slice(0, 4).map(entry => (
                  <div className="w-[260px] shrink-0 snap-center sm:w-auto" key={entry.id}>
                    <VideoCard entry={entry} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {(data.popularThisMonth.length > 0 || data.popularLists.length > 0) && (
            <div className="pt-8 border-t border-border/50">
              <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-xl font-bold tracking-tight">Trending This Month</h2>
                <Link href="/explore" className="text-sm text-primary hover:underline flex items-center font-semibold">
                  Explore <ChevronRight className="w-4 h-4 ml-0.5" />
                </Link>
              </div>
              
              {data.popularThisMonth.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  {data.popularThisMonth.slice(0, 3).map(entry => (
                    <VideoCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}

              {data.popularLists.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {data.popularLists.slice(0, 2).map(list => (
                    <ListCard key={list.id} playlist={list} />
                  ))}
                </div>
              )}
            </div>
          )}

          {data.watchlist.length === 0 && data.recentlyAdded.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-card rounded-[2rem] border border-border border-dashed shadow-sm mt-8">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <img src="/logo.svg" className="w-8 h-8 opacity-50 grayscale" alt="" />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight">Your library is empty</h3>
              <p className="text-muted-foreground text-sm max-w-md mb-6 font-medium">
                Start building your personal learning library by saving a YouTube tutorial or playlist.
              </p>
              <Link href="/add">
                <Button className="rounded-xl font-semibold">Save a Video</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}