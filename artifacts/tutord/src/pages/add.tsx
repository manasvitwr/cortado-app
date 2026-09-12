import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button, Input, Textarea, Badge } from "@/components/ui";
import { useCreateEntry, useImportPlaylist, getGetEntriesQueryKey, getGetPlaylistsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Youtube, Link as LinkIcon, AlertCircle, LayoutList, Video as VideoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";

export default function Add() {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<'watchlist' | 'watching' | 'watched'>('watchlist');
  const [mode, setMode] = useState<'video' | 'playlist'>('video');
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createEntry = useCreateEntry();
  const importPlaylist = useImportPlaylist();

  // Pre-fill URL from query params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      setUrl(urlParam);
      if (urlParam.includes('playlist?list=')) {
        setMode('playlist');
      }
    }
  }, []);

  const isPending = createEntry.isPending || importPlaylist.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (mode === 'playlist') {
      importPlaylist.mutate({ data: { url } }, {
        onSuccess: (playlist) => {
          queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          toast({ title: "Playlist imported", description: `Saved "${playlist.title}"` });
          setLocation(`/lists/${playlist.id}`);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to import playlist. Check the URL and try again.", variant: "destructive" });
        }
      });
    } else {
      createEntry.mutate({ data: { url, caption, status } }, {
        onSuccess: (entry) => {
          queryClient.invalidateQueries({ queryKey: getGetEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          toast({ title: "Video saved", description: "Added to your library" });
          setLocation(`/entries/${entry.id}`);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save video. Check the URL and try again.", variant: "destructive" });
        }
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <header className="px-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Youtube className="w-8 h-8 text-primary" />
            Add to Library
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Save a YouTube video or import an entire playlist.</p>
        </header>

        <Tabs value={mode} onValueChange={(v) => { setMode(v as 'video'|'playlist'); setUrl(''); }} className="w-full">
          <TabsList className="flex gap-2 mb-6 bg-secondary/50 p-1.5 rounded-xl w-full">
            <TabsTrigger 
              value="video"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none"
            >
              <VideoIcon className="w-4 h-4" /> Save Video
            </TabsTrigger>
            <TabsTrigger 
              value="playlist"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none"
            >
              <LayoutList className="w-4 h-4" /> Import Playlist
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 sm:p-8 rounded-[2rem] border border-border shadow-xl">
            <div className="space-y-3">
              <label className="text-sm font-bold">
                {mode === 'playlist' ? 'YouTube Playlist URL' : 'YouTube Video URL'}
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder={mode === 'playlist' ? "https://youtube.com/playlist?list=..." : "https://youtube.com/watch?v=..."}
                  className="pl-11 h-12 rounded-xl bg-input border-border focus:ring-primary text-base"
                  autoFocus
                  required
                />
              </div>
              {mode === 'playlist' && (
                <p className="text-xs text-muted-foreground font-medium mt-2 leading-relaxed">
                  Imports the first 25 videos from the playlist automatically. Videos are saved to the list, not directly to your library unless you save them individually later.
                </p>
              )}
            </div>

            {mode === 'video' && (
              <>
                <div className="space-y-3">
                  <label className="text-sm font-bold">Initial Status</label>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {(['watchlist', 'watching', 'watched'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className="focus:outline-none flex-1 sm:flex-none"
                      >
                        <Badge 
                          variant={status === s ? (s === 'watching' ? 'peach' : 'default') : 'outline'}
                          className={`px-4 py-2.5 sm:py-2 text-sm cursor-pointer w-full justify-center transition-all ${status !== s ? 'border-border bg-background/50 hover:bg-secondary' : ''}`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground flex justify-between">
                    Quick Note <span className="font-medium text-muted-foreground">Optional</span>
                  </label>
                  <Textarea 
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Why are you saving this?"
                    className="min-h-[120px] rounded-xl bg-input border-border focus:ring-primary text-base resize-none"
                  />
                </div>
              </>
            )}

            <Button type="submit" size="lg" className="w-full rounded-xl mt-6 h-14 font-bold text-base shadow-lg shadow-primary/20" isLoading={isPending}>
              {mode === 'playlist' ? "Import Playlist" : "Save Video"}
            </Button>
          </form>
        </Tabs>
      </div>
    </Layout>
  );
}
