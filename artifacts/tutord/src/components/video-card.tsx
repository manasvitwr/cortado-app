import { Link } from "wouter";
import { PlayCircle, Clock, Star, MoreVertical } from "lucide-react";
import { Badge } from "./ui";
import { formatDuration } from "@/lib/utils";
import type { Entry, Video } from "@workspace/api-client-react";

interface VideoCardProps {
  entry?: Entry;
  video?: Video;
  showStatus?: boolean;
}

export function VideoCard({ entry, video, showStatus = true }: VideoCardProps) {
  const v = entry ? entry.video : video;
  if (!v) return null;

  return (
    <Link href={entry ? `/entries/${entry.id}` : `/add?url=${encodeURIComponent(v.originalUrl)}`}>
      <div className="group flex flex-col gap-3 cursor-pointer">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-secondary ring-1 ring-border/50 group-hover:ring-primary/50 transition-all group-hover:shadow-lg group-hover:shadow-primary/5">
          <img 
            src={v.thumbnailUrl} 
            alt={v.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/80 backdrop-blur px-2 py-1 rounded-md text-xs font-medium text-white">
            <Clock className="w-3 h-3 text-primary" />
            {formatDuration(v.duration)}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-300">
            <div className="w-12 h-12 bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl">
              <PlayCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {v.title}
            </h3>
            {entry && (
              <button className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <span className="truncate">{v.channelName}</span>
            {entry?.rating && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {entry.rating}
                </span>
              </>
            )}
          </div>

          {entry && showStatus && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant={
                entry.status === 'watched' ? 'default' : 
                entry.status === 'watching' ? 'peach' : 'secondary'
              }>
                {entry.status}
              </Badge>
              {entry.visibility === 'public' && (
                <Badge variant="outline">Public</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-video w-full rounded-2xl bg-secondary animate-pulse" />
      <div className="space-y-2 px-1">
        <div className="h-5 bg-secondary rounded animate-pulse w-full" />
        <div className="h-5 bg-secondary rounded animate-pulse w-3/4" />
        <div className="h-4 bg-secondary rounded animate-pulse w-1/2 mt-2" />
      </div>
    </div>
  );
}