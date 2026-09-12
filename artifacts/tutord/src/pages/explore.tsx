import { Layout } from "@/components/layout";
import { useGetTrending } from "@workspace/api-client-react";
import { VideoCard, VideoCardSkeleton } from "@/components/video-card";
import { ListCard, ListCardSkeleton } from "@/components/list-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";

export default function Explore() {
  const { data, isLoading, error } = useGetTrending();

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Compass className="w-8 h-8 text-primary" />
            Explore
          </h1>
          <p className="text-muted-foreground mt-2">Discover popular tutorials and curated lists.</p>
        </header>

        {isLoading ? (
          <div className="space-y-8">
            <div className="h-10 bg-secondary rounded-xl w-64 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <VideoCardSkeleton key={i} />)}
            </div>
          </div>
        ) : error || !data ? (
          <div className="p-8 bg-card rounded-2xl border border-border text-center">
            <p className="text-destructive font-medium">Failed to load explore data.</p>
          </div>
        ) : (
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="flex gap-2 mb-8 bg-secondary/50 p-1.5 rounded-xl w-fit">
              <TabsTrigger 
                value="videos"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none"
              >
                Trending Videos
              </TabsTrigger>
              <TabsTrigger 
                value="lists"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none"
              >
                Curated Lists
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="videos" className="focus:outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {data.featured.map(entry => (
                  <VideoCard key={entry.id} entry={entry} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="lists" className="focus:outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {data.lists.map(list => (
                  <ListCard key={list.id} playlist={list} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}