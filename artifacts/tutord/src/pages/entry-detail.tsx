import { useState, useRef, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useGetEntry, useUpdateEntry, useDeleteEntry, getGetEntryQueryKey, getGetDashboardQueryKey, getGetEntriesQueryKey } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Textarea, Badge } from "@/components/ui";
import { Star, Clock, ArrowLeft, Trash2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDuration, formatDate } from "@/lib/utils";

export default function EntryDetail() {
  const [, params] = useRoute("/entries/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: entry, isLoading, error } = useGetEntry(id);
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();

  const [notes, setNotes] = useState("");
  const [caption, setCaption] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (entry && !initialized.current) {
      setNotes(entry.notes || "");
      setCaption(entry.caption || "");
      initialized.current = true;
    }
  }, [entry]);

  const mutateFnRef = useRef(updateEntry.mutate);
  mutateFnRef.current = updateEntry.mutate;

  const saveNotes = useCallback(() => {
    if (!entry) return;
    mutateFnRef.current({ entryId: id, data: { notes, caption } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetEntryQueryKey(id), data);
        toast({ title: "Notes saved", duration: 2000 });
      }
    });
  }, [id, entry, notes, caption, queryClient, toast]);

  const updateStatus = (status: 'watchlist' | 'watching' | 'watched') => {
    if (!entry) return;
    mutateFnRef.current({ entryId: id, data: { status } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetEntryQueryKey(id), data);
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      }
    });
  };

  const updateRating = (rating: number) => {
    if (!entry) return;
    mutateFnRef.current({ entryId: id, data: { rating } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetEntryQueryKey(id), data);
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this from your library?")) {
      deleteEntry.mutate({ entryId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          toast({ title: "Video deleted" });
          setLocation("/home");
        }
      });
    }
  };

  if (isLoading) return <Layout><div className="animate-pulse h-96 bg-secondary rounded-2xl mt-4" /></Layout>;
  if (error || !entry) return <Layout><p>Error loading tutorial.</p></Layout>;

  return (
    <Layout>
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="-ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {/* Video Player */}
        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border">
          <iframe 
            src={`https://www.youtube.com/embed/${entry.video.youtubeId}?rel=0`} 
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>

        {/* Meta Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight mb-2">
            {entry.video.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{entry.video.channelName}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDuration(entry.video.duration)}</span>
            <span>•</span>
            <span>Saved {formatDate(entry.createdAt)}</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-2xl border border-border shadow-sm">
          <div className="flex bg-secondary/50 rounded-lg p-1">
            {(['watchlist', 'watching', 'watched'] as const).map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  entry.status === s 
                    ? (s === 'watched' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background text-foreground shadow-sm') 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-border hidden sm:block mx-1" />

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => updateRating(star)} className="p-1.5 rounded-full hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
                <Star className={`w-5 h-5 ${entry.rating && entry.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Your Notes
                </h3>
                <Button size="sm" variant="secondary" onClick={saveNotes} isLoading={updateEntry.isPending}>Save</Button>
              </div>
              <Textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What did you learn? Write key takeaways here..."
                className="min-h-[250px] border-0 shadow-none focus-visible:ring-0 p-0 text-base leading-relaxed bg-transparent resize-none"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Quick Caption</label>
                <Textarea 
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="A one sentence reminder..."
                  className="min-h-[80px] text-sm bg-secondary/30"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Visibility</label>
                <Badge variant={entry.visibility === 'public' ? 'outline' : 'secondary'} className="gap-1.5 px-3 py-1">
                  {entry.visibility === 'public' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {entry.visibility.charAt(0).toUpperCase() + entry.visibility.slice(1)}
                </Badge>
              </div>

              {entry.summary && (
                <div className="pt-4 border-t border-border">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Manual Summary</label>
                  <p className="text-sm leading-relaxed">{entry.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}