import { Link } from "wouter";
import { LayoutList, Lock } from "lucide-react";
import type { Playlist } from "@workspace/api-client-react";

export function ListCard({ playlist }: { playlist: Playlist }) {
  const thumbUrl = playlist.thumbnailUrl || (playlist.videos && playlist.videos.length > 0 ? playlist.videos[0].thumbnailUrl : null);

  return (
    <Link href={`/lists/${playlist.id}`}>
      <div className="group flex flex-col gap-3 cursor-pointer mt-4">
        {/* Stacked effect via box-shadow defined in index.css */}
        <div className="relative aspect-video w-full rounded-2xl bg-card border border-border stacked-cards-shadow transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-none group-hover:ring-1 group-hover:ring-primary/50 z-10 overflow-hidden">
          {thumbUrl ? (
            <img src={thumbUrl} alt={playlist.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/50">
              <LayoutList className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg">
              <LayoutList className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-white">{playlist.videoCount}</span>
            </div>
            {playlist.visibility === 'private' && (
              <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-lg text-white/70">
                <Lock className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        <div className="px-1 z-20">
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg line-clamp-1">{playlist.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
            {playlist.description || (playlist.source === 'youtube' ? 'Imported from YouTube' : 'Custom learning list')}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function ListCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="relative aspect-video w-full rounded-2xl bg-secondary animate-pulse stacked-cards-shadow z-10" />
      <div className="space-y-2 px-1 z-20">
        <div className="h-6 bg-secondary rounded animate-pulse w-3/4" />
        <div className="h-4 bg-secondary rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}