import { Link } from "wouter";
import { PlayCircle, Clock, Star, MoreVertical, BookmarkPlus, Check } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatDuration } from "@/lib/utils";
import type { Entry, Video } from "@workspace/api-client-react";

interface VideoCardProps {
  entry?: Entry;
  video?: Video;
  showStatus?: boolean;
  compact?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export function VideoCard({
  entry,
  video,
  showStatus = true,
  compact = false,
  onSave,
  isSaving = false,
  isSaved = false,
}: VideoCardProps) {
  const v = entry ? entry.video : video;
  if (!v) return null;

  if (compact) {
    return (
      <Link href={entry ? `/entries/${entry.id}` : `/add?url=${encodeURIComponent(v.originalUrl)}`}>
        <div className="group flex flex-col gap-2 cursor-pointer w-full">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-secondary border border-border group-hover:border-primary/50 transition-all group-hover:shadow-lg group-hover:shadow-primary/5">
            <img 
              src={v.thumbnailUrl} 
              alt={v.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-bold text-sm text-white line-clamp-2 leading-tight tracking-tight shadow-black drop-shadow-md">
                {v.title}
              </h3>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={entry ? `/entries/${entry.id}` : `/add?url=${encodeURIComponent(v.originalUrl)}`}>
      <div className="group flex flex-col gap-3 cursor-pointer w-full">
        <div className="relative aspect-video w-full overflow-hidden rounded-[1.5rem] bg-secondary border border-border group-hover:border-primary/50 transition-all group-hover:shadow-lg group-hover:shadow-primary/5">
          <img 
            src={v.thumbnailUrl} 
            alt={v.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-black/80 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-semibold text-white shadow-sm border border-white/10">
            <Clock className="w-3 h-3 text-primary" />
            {formatDuration(v.duration)}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-300">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
              <PlayCircle className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors tracking-tight">
              {v.title}
            </h3>
            {entry && (
              <button className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5" onClick={e => e.preventDefault()}>
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground font-medium">
            <span className="truncate">{v.channelName}</span>
            <div className="flex items-center gap-2 shrink-0">
              {entry?.rating && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="flex items-center gap-1 text-primary font-semibold">
                    <Star className="w-3 h-3 fill-current" />
                    {entry.rating}
                  </span>
                </>
              )}
              {onSave && (
                <button
                  type="button"
                  aria-label={isSaved ? "Saved to your library" : `Save ${v.title}`}
                  aria-busy={isSaving}
                  disabled={isSaving || isSaved}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!isSaved && !isSaving) onSave();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/80 px-2 py-1 text-[11px] font-bold text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-default disabled:opacity-70"
                >
                  {isSaved ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                  {isSaved ? "Saved" : isSaving ? "Saving…" : "Save"}
                </button>
              )}
            </div>
          </div>

          {entry && showStatus && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant={
                entry.status === 'watched' ? 'default' : 
                entry.status === 'watching' ? 'peach' : 'secondary'
              }>
                {entry.status}
              </Badge>
              {entry.visibility === 'public' && (
                <Badge variant="outline" className="border-border text-muted-foreground">Public</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function VideoCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="w-full aspect-square rounded-3xl bg-secondary animate-pulse border border-border" />
    );
  }
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="aspect-video w-full rounded-[1.5rem] bg-secondary animate-pulse border border-border" />
      <div className="space-y-2 px-1">
        <div className="h-5 bg-secondary rounded-md animate-pulse w-full" />
        <div className="h-5 bg-secondary rounded-md animate-pulse w-3/4" />
        <div className="h-4 bg-secondary rounded-md animate-pulse w-1/2 mt-2" />
      </div>
    </div>
  );
}
