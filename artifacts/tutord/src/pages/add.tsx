import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button, Input, Textarea, Badge } from "@/components/ui";
import { useCreateEntry, useImportPlaylist, getGetEntriesQueryKey, getGetPlaylistsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Youtube, Link as LinkIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Add() {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<'watchlist' | 'watching' | 'watched'>('watchlist');
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createEntry = useCreateEntry();
  const importPlaylist = useImportPlaylist();

  // Pre-fill URL from query params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) setUrl(urlParam);
  }, []);

  const isPlaylist = url.includes('playlist?list=');
  const isPending = createEntry.isPending || importPlaylist.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (isPlaylist) {
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
      <div className="max-w-xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="px-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Youtube className="w-8 h-8 text-primary" />
            Save a Tutorial
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Paste a YouTube video or playlist link to add it to your library.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 sm:p-8 rounded-[2rem] border border-border shadow-xl">
          <div className="space-y-3">
            <label className="text-sm font-bold">YouTube URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..." 
                className="pl-11 h-12 rounded-xl bg-input border-border focus:ring-primary text-base"
                autoFocus
                required
              />
            </div>
            {isPlaylist && (
              <p className="text-xs text-primary flex items-center gap-1.5 mt-2 bg-primary/10 w-fit px-3 py-2 rounded-xl font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                This looks like a playlist. We'll import it as a new list.
              </p>
            )}
          </div>

          {!isPlaylist && (
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
                        className="px-4 py-2 sm:py-1.5 text-sm cursor-pointer hover:bg-secondary/80 w-full justify-center border-border"
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

          <Button type="submit" size="lg" className="w-full rounded-xl mt-6 h-12 font-bold text-base shadow-lg shadow-primary/20" isLoading={isPending}>
            {isPlaylist ? "Import Playlist" : "Save Video"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}