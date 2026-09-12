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

  if (isLoading) return <Layout><div className="animate-pulse h-96 w-full bg-secondary rounded-[2rem] mt-4" /></Layout>;
  if (error || !entry) return <Layout><p className="p-8 text-center text-destructive font-bold bg-card rounded-[2rem] mt-4 border border-border shadow-xl">Error loading tutorial.</p></Layout>;

  return (
    <Layout>
      <div className="space-y-6 pb-12 animate-in fade-in duration-300 w-full max-w-screen-md mx-auto">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="-ml-3 text-muted-foreground hover:text-foreground font-bold h-10 px-4 rounded-xl">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </Button>

        {/* Video Player */}
        <div className="aspect-video w-full bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-border relative">
          <iframe 
            src={`https://www.youtube.com/embed/${entry.video.youtubeId}?rel=0`} 
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
          />
        </div>

        {/* Meta Header */}
        <div className="px-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight mb-3">
            {entry.video.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
            <span className="text-primary font-bold">{entry.video.channelName}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md text-xs font-bold text-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" /> {formatDuration(entry.video.duration)}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Saved {formatDate(entry.createdAt)}</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-[2rem] border border-border shadow-xl">
          <div className="flex w-full sm:w-auto bg-secondary/50 rounded-xl p-1 shrink-0 overflow-x-auto hide-scrollbar">
            {(['watchlist', 'watching', 'watched'] as const).map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  entry.status === s 
                    ? (s === 'watching' ? 'bg-primary/20 text-primary shadow-sm' : 'bg-card text-foreground shadow-sm')
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="h-8 w-px bg-border hidden sm:block mx-1" />

          <div className="flex items-center gap-1.5 shrink-0 px-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => updateRating(star)} className="p-1 rounded-full hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
                <Star className={`w-6 h-6 sm:w-5 sm:h-5 ${entry.rating && entry.rating >= star ? 'fill-primary text-primary drop-shadow-sm' : 'text-muted-foreground/30'}`} />
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[1rem]" />

          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-11 w-11 shrink-0">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex">
            <div className="bg-card border border-border p-6 rounded-[2rem] shadow-xl focus-within:ring-1 focus-within:ring-primary/50 transition-all flex flex-col w-full min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 tracking-tight">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Your Notes
                </h3>
                <Button size="sm" variant="secondary" className="rounded-xl font-bold px-4 border border-border" onClick={saveNotes} isLoading={updateEntry.isPending}>Save</Button>
              </div>
              <Textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What did you learn? Write key takeaways here..."
                className="flex-1 border-0 shadow-none focus-visible:ring-0 p-0 text-base leading-relaxed bg-transparent resize-none font-medium text-foreground/90 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-[2rem] shadow-xl space-y-6 flex flex-col h-full">
              <div>
                <label className="text-sm font-bold text-foreground mb-2 block">Quick Caption</label>
                <Textarea 
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="A one sentence reminder..."
                  className="min-h-[100px] text-sm bg-input border-border rounded-xl resize-none focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-foreground mb-3 block">Visibility</label>
                <Badge variant={entry.visibility === 'public' ? 'outline' : 'secondary'} className={`gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border-border ${entry.visibility === 'public' ? 'text-primary border-primary/30 bg-primary/5' : ''}`}>
                  {entry.visibility === 'public' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {entry.visibility.charAt(0).toUpperCase() + entry.visibility.slice(1)}
                </Badge>
              </div>

              {entry.summary && (
                <div className="pt-6 border-t border-border flex-1">
                  <label className="text-sm font-bold text-foreground mb-2 block flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary fill-primary/20" />
                    AI Summary
                  </label>
                  <p className="text-sm leading-relaxed text-muted-foreground font-medium bg-background/50 p-4 rounded-xl border border-border/50">{entry.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}