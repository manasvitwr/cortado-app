import { Layout } from "@/components/layout";
import {
  getGetDashboardQueryKey,
  getGetEntriesQueryKey,
  getGetTrendingQueryKey,
  useCreateEntry,
  useGetTrending,
} from "@workspace/api-client-react";
import { VideoCard, VideoCardSkeleton } from "@/components/video-card";
import { ListCard } from "@/components/list-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { AlertCircle, Compass, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Explore() {
  const { data, isLoading, error, refetch, isFetching } = useGetTrending({
    query: { staleTime: 60_000, queryKey: getGetTrendingQueryKey() },
  });
  const createEntry = useCreateEntry();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  const saveVideo = (id: string, url: string, title: string) => {
    setSavingId(id);
    createEntry.mutate(
      { data: { url } },
      {
        onSuccess: () => {
          setSavedIds((current) => new Set(current).add(id));
          void queryClient.invalidateQueries({ queryKey: getGetEntriesQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetTrendingQueryKey() });
          toast({ title: "Video saved", description: `"${title}" is in your library.` });
        },
        onError: () => {
          toast({
            title: "Couldn't save video",
            description: "Check your connection and try again.",
            variant: "destructive",
          });
        },
        onSettled: () => setSavingId(null),
      },
    );
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500 w-full">
        <header className="px-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Compass className="w-8 h-8 text-primary" />
            Explore
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Discover what the Cortado community is saving and learning next.
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-8 px-1">
            <div className="h-12 bg-secondary rounded-xl w-64 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : error || !data ? (
          <div className="p-8 bg-card rounded-[2rem] border border-border text-center shadow-xl">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <p className="text-destructive font-bold">Failed to load discovery.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your library is safe. Try loading the Cortado community feed again.
            </p>
            <Button
              variant="outline"
              className="mt-5 rounded-xl font-bold"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Retrying…" : "Try again"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="videos" className="w-full px-1">
            <TabsList className="flex gap-2 mb-8 bg-secondary/50 p-1.5 rounded-xl w-fit overflow-x-auto hide-scrollbar">
              <TabsTrigger
                value="videos"
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none whitespace-nowrap"
              >
                Trending Videos
              </TabsTrigger>
              <TabsTrigger
                value="lists"
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none whitespace-nowrap"
              >
                Curated Lists
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="focus:outline-none">
              <div className="mb-6 rounded-2xl border border-border bg-card/60 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Trending on Cortado
                      {data.isPersonalized ? " · tuned for you" : ""}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {data.trendingBasis}
                    </p>
                  </div>
                </div>
              </div>

              {data.featured.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {data.featured.map((entry) => (
                    <VideoCard
                      key={entry.id}
                      entry={entry}
                      onSave={() =>
                        saveVideo(entry.video.id, entry.video.originalUrl, entry.video.title)
                      }
                      isSaving={savingId === entry.video.id}
                      isSaved={savedIds.has(entry.video.id)}
                    />
                  ))}
                </div>
              ) : data.editorialVideos.length > 0 ? (
                <>
                  <div className="mb-5 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Cortado is still gathering community activity here. These editorial
                    picks were verified live through YouTube metadata and are not
                    presented as popularity rankings.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {data.editorialVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onSave={() => saveVideo(video.id, video.originalUrl, video.title)}
                        isSaving={savingId === video.id}
                        isSaved={savedIds.has(video.id)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-border bg-card/50 p-10 text-center">
                  <h3 className="text-lg font-bold text-foreground">No public activity yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Be the first Cortado learner to save a tutorial publicly, or
                    start your private library from the Add tab.
                  </p>
                  <Link href="/add">
                    <Button className="mt-5 rounded-xl font-bold">Add a tutorial</Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="lists" className="focus:outline-none">
              <div className="mb-6 rounded-2xl border border-border bg-card/60 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Curated lists{data.isPersonalized ? " for you" : ""}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {data.listsBasis}
                    </p>
                  </div>
                </div>
              </div>
              {data.lists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {data.lists.map((list) => (
                    <ListCard key={list.id} playlist={list} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-border bg-card/50 p-10 text-center">
                  <h3 className="text-lg font-bold text-foreground">No public lists yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Community lists will appear here once someone publishes one.
                    You can still import a real YouTube playlist for your own library.
                  </p>
                  <Link href="/add">
                    <Button className="mt-5 rounded-xl font-bold">Import a playlist</Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}