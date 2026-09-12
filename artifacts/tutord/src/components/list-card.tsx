import { Link } from "wouter";
import { LayoutList, Lock, ChevronRight } from "lucide-react";
import type { Playlist } from "@workspace/api-client-react";

export function ListCard({ playlist }: { playlist: Playlist }) {
  const thumbUrl = playlist.thumbnailUrl || (playlist.videos && playlist.videos.length > 0 ? playlist.videos[0].thumbnailUrl : null);

  return (
    <Link href={`/lists/${playlist.id}`}>
      <div className="group flex flex-col gap-3 cursor-pointer mt-4">
        {/* Stacked effect via box-shadow defined in index.css */}
        <div className="relative aspect-video w-full rounded-[1.5rem] bg-card border border-border stacked-cards-shadow transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-none group-hover:border-primary/50 z-10 overflow-hidden">
          {thumbUrl ? (
            <img src={thumbUrl} alt={playlist.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <LayoutList className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <LayoutList className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-white">{playlist.videoCount}</span>
            </div>
            {playlist.visibility === 'private' && (
              <div className="bg-black/50 backdrop-blur-md p-1.5 rounded-lg border border-white/10 text-white/70">
                <Lock className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          
          {/* Overlay play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20">
              <ChevronRight className="w-6 h-6 ml-0.5" />
            </div>
          </div>
        </div>

        <div className="px-1 z-20">
          <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1">{playlist.title}</h3>
          <p className="text-xs text-muted-foreground font-medium line-clamp-1 mt-0.5">
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
      <div className="relative aspect-video w-full rounded-[1.5rem] bg-secondary animate-pulse stacked-cards-shadow z-10" />
      <div className="space-y-2 px-1 z-20">
        <div className="h-6 bg-secondary rounded-md animate-pulse w-3/4" />
        <div className="h-4 bg-secondary rounded-md animate-pulse w-1/2" />
      </div>
    </div>
  );
}