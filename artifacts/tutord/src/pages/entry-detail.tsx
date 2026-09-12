import { useState, useRef, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useGetEntry, useUpdateEntry, useDeleteEntry, getGetEntryQueryKey, getGetDashboardQueryKey, getGetEntriesQueryKey } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Textarea, Badge } from "@/components/ui";
import { Star, Clock, ArrowLeft, Trash2, CalendarDays, Eye, EyeOff } from "lucide-react";
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
        toast({ title: "Review saved", duration: 2000 });
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

  if (isLoading) return <Layout><div className="animate-pulse h-[80vh] w-full bg-secondary rounded-[2rem]" /></Layout>;
  if (error || !entry) return <Layout><p className="p-8 text-center text-destructive font-bold bg-card rounded-[2rem] border border-border shadow-xl">Error loading tutorial.</p></Layout>;

  return (
    <Layout>
      <div className="flex flex-col h-full min-h-[calc(100dvh-5rem)] pb-12 animate-in fade-in duration-300 w-full max-w-screen-md mx-auto">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="-ml-3 text-foreground font-bold h-10 px-4 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 mr-2" /> Write Your Review
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 shrink-0">
            <Trash2 className="w-5 h-5" />
          </Button>
        </header>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-2">
              {entry.video.title} <span className="text-muted-foreground text-lg md:text-2xl font-semibold">({new Date(entry.createdAt).getFullYear()})</span>
            </h1>
            <p className="text-primary font-bold mb-6">{entry.video.channelName}</p>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Specify the date you watched it</p>
                <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 w-fit pr-6">
                  <CalendarDays className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{formatDate(entry.createdAt)}</span>
                  <span className="text-xs text-primary font-bold ml-6 cursor-pointer hover:underline">Change</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Give your rating</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => updateRating(star)} className="focus:outline-none focus:scale-110 transition-transform">
                      <Star className={`w-8 h-8 ${entry.rating && entry.rating >= star ? 'fill-primary text-primary drop-shadow-sm' : 'text-muted-foreground/30'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-border aspect-[2/3] md:aspect-auto">
            <img src={entry.video.thumbnailUrl} alt={entry.video.title} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex bg-secondary/50 rounded-xl p-1 shrink-0">
            {(['watchlist', 'watching', 'watched'] as const).map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  entry.status === s 
                    ? (s === 'watching' ? 'bg-primary/20 text-primary shadow-sm' : 'bg-card text-foreground shadow-sm')
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <Badge variant={entry.visibility === 'public' ? 'outline' : 'secondary'} className={`gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border-border ${entry.visibility === 'public' ? 'text-primary border-primary/30 bg-primary/5' : ''}`}>
            {entry.visibility === 'public' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {entry.visibility.charAt(0).toUpperCase() + entry.visibility.slice(1)}
          </Badge>
        </div>

        <div className="flex-1 flex flex-col min-h-[300px] mb-8">
          <Textarea 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Write down your review..."
            className="flex-1 bg-card border-border rounded-[2rem] p-6 text-base md:text-lg leading-relaxed resize-none font-medium text-foreground/90 placeholder:text-muted-foreground/50 shadow-inner focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={saveNotes} 
            isLoading={updateEntry.isPending} 
            className="rounded-full font-bold px-12 h-14 text-lg shadow-xl shadow-primary/20"
          >
            Publish
          </Button>
        </div>

      </div>
    </Layout>
  );
}
