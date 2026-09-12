import { Layout } from "@/components/layout";
import { useGetProfile } from "@workspace/api-client-react";
import { VideoCard } from "@/components/video-card";
import { ListCard } from "@/components/list-card";
import { useClerk } from "@clerk/react";
import { Button } from "@/components/ui";
import { LogOut, User as UserIcon, PlaySquare, Bookmark, FolderHeart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

export default function Profile() {
  const { data, isLoading, error } = useGetProfile();
  const { signOut } = useClerk();

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl border border-primary/30 shadow-inner">
              {data?.avatarUrl ? (
                <img src={data.avatarUrl} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <UserIcon className="w-8 h-8" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{data?.displayName || "Profile"}</h1>
              <p className="text-muted-foreground">@{data?.username || "loading..."}</p>
            </div>
          </div>
          
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </header>

        {isLoading ? (
          <div className="space-y-8">
            <div className="flex gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 flex-1 bg-secondary rounded-2xl animate-pulse" />)}
            </div>
          </div>
        ) : error || !data ? (
          <div className="p-8 bg-card rounded-2xl border border-border text-center">
            <p className="text-destructive font-medium">Failed to load profile.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center">
                <Bookmark className="w-6 h-6 text-primary mb-2 opacity-80" />
                <span className="text-2xl font-bold">{data.stats.videosSaved}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Saved</span>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center">
                <PlaySquare className="w-6 h-6 text-primary mb-2 opacity-80" />
                <span className="text-2xl font-bold">{data.stats.videosWatched}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Watched</span>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center">
                <FolderHeart className="w-6 h-6 text-primary mb-2 opacity-80" />
                <span className="text-2xl font-bold">{data.stats.playlistsCreated}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Lists</span>
              </div>
            </div>

            <Tabs defaultValue="recent" className="w-full mt-8">
              <TabsList className="flex gap-2 mb-6 bg-secondary/50 p-1.5 rounded-xl w-fit">
                <TabsTrigger 
                  value="recent"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none"
                >
                  Recent Saves
                </TabsTrigger>
                <TabsTrigger 
                  value="lists"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none"
                >
                  Public Lists
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="recent" className="focus:outline-none">
                {data.recentEntries.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {data.recentEntries.map(entry => (
                      <VideoCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center bg-card rounded-2xl border border-border border-dashed">No saved videos yet.</p>
                )}
              </TabsContent>
              
              <TabsContent value="lists" className="focus:outline-none">
                {data.publicPlaylists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {data.publicPlaylists.map(list => (
                      <ListCard key={list.id} playlist={list} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center bg-card rounded-2xl border border-border border-dashed">No public lists.</p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
}