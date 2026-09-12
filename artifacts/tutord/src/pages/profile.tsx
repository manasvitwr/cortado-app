import { Layout } from "@/components/layout";
import { useGetProfile, useUpdateProfile, useRequestUploadUrl, getGetProfileQueryKey, getGetStorageObjectUrl, type Entry, UploadUrlRequestContentType } from "@workspace/api-client-react";
import { VideoCard } from "@/components/video-card";
import { ListCard } from "@/components/list-card";
import { useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, PlaySquare, Bookmark, FolderHeart, Plus, Camera, X, Loader2, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

function ImageUploadArea({ 
  type, 
  currentUrl, 
  onUpload, 
  isUploading 
}: { 
  type: 'banner' | 'avatar', 
  currentUrl?: string | null, 
  onUpload: (f: File) => void,
  isUploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    inputRef.current?.click();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <>
      <input type="file" ref={inputRef} className="hidden" accept="image/jpeg, image/png, image/webp, image/gif" onChange={handleChange} />
      <button 
        onClick={handleClick}
        className={cn(
          "group relative overflow-hidden flex items-center justify-center transition-all shrink-0",
          type === 'banner' 
            ? "w-full h-32 sm:h-48 bg-secondary" 
            : "w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[4px] border-card -mt-10 ml-4 sm:ml-8 z-10 shadow-xl bg-card",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        {currentUrl ? (
          <img src={currentUrl} className="w-full h-full object-cover" alt={type} />
        ) : (
          type === 'avatar' 
            ? <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground opacity-50" /> 
            : <div className="w-full h-full bg-gradient-to-tr from-secondary to-card" />
        )}
        
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
          currentUrl ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}>
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white drop-shadow-md" />
          )}
        </div>
      </button>
    </>
  );
}

function TopFourCard({ entry, onRemove }: { entry: Entry, onRemove: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 group relative w-[88px] shrink-0 snap-center">
      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors shrink-0 shadow-lg">
        <img src={entry.video.thumbnailUrl} className="w-full h-full object-cover" alt={entry.video.title} />
        <button
          onClick={onRemove}
          aria-label={`Remove ${entry.video.title} from Top 4`}
          className="absolute right-0 top-0 m-1 size-7 rounded-full bg-black/75 flex items-center justify-center transition-transform hover:scale-105"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      <span className="text-[11px] text-center font-medium line-clamp-2 leading-tight px-1 text-foreground/80 group-hover:text-primary transition-colors">
        {entry.video.title}
      </span>
    </div>
  )
}

function EmptyTopFourSlot({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group w-[88px] shrink-0 snap-center">
      <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-card group-hover:border-primary group-hover:bg-primary/10 transition-all shrink-0">
        <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-[11px] text-center font-medium text-muted-foreground group-hover:text-primary transition-colors">Add</span>
    </button>
  )
}

export default function Profile() {
  const { data, isLoading, error } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const requestUrl = useRequestUploadUrl();
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleUpload = async (file: File, type: 'banner' | 'avatar') => {
    const setUploading = type === 'banner' ? setUploadingBanner : setUploadingAvatar;
    setUploading(true);
    try {
      const contentType = file.type as UploadUrlRequestContentType;
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType)) {
        throw new Error("Invalid image type");
      }
      
      const { uploadURL, objectPath } = await requestUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType }
      });
      
      const res = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
      if (!res.ok) throw new Error("Upload failed");
      
      const finalUrl = getGetStorageObjectUrl(objectPath);
      await updateProfile.mutateAsync({ data: { [`${type}Url`]: finalUrl } });
      
      queryClient.setQueryData(getGetProfileQueryKey(), (old: any) => old ? { ...old, [`${type}Url`]: finalUrl } : old);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const topEntryIds = data?.topEntries?.map(e => e.id) || [];
  
  const handleAddTopFour = async (id: string) => {
    if (topEntryIds.length >= 4 || !data) return;
    const newIds = [...topEntryIds, id];
    
    queryClient.setQueryData(getGetProfileQueryKey(), (old: any) => {
      if (!old) return old;
      const addedEntry = data.libraryEntries.find((e: Entry) => e.id === id);
      return {
        ...old,
        topEntries: [...(old.topEntries || []), addedEntry].filter(Boolean)
      };
    });
    
    try {
      await updateProfile.mutateAsync({ data: { topEntryIds: newIds } });
      setIsDrawerOpen(false);
    } catch (err) {
      queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    }
  };

  const handleRemoveTopFour = async (id: string) => {
    const newIds = topEntryIds.filter(existingId => existingId !== id);
    
    queryClient.setQueryData(getGetProfileQueryKey(), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        topEntries: (old.topEntries || []).filter((e: Entry) => e.id !== id)
      };
    });
    
    try {
      await updateProfile.mutateAsync({ data: { topEntryIds: newIds } });
    } catch (err) {
      queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8 animate-pulse">
          <div className="h-48 bg-secondary rounded-[2rem] w-full" />
          <div className="flex gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 flex-1 bg-secondary rounded-2xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="p-8 bg-card rounded-[2rem] border border-border text-center mt-10">
          <p className="text-destructive font-bold">Failed to load profile.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-in fade-in duration-500 w-full max-w-screen-md mx-auto space-y-8">
        
        {/* Header Profile Section */}
        <div className="relative rounded-[2rem] overflow-hidden bg-card border border-border shadow-xl">
          <ImageUploadArea type="banner" currentUrl={data.bannerUrl} onUpload={(f) => handleUpload(f, 'banner')} isUploading={uploadingBanner} />
          
          <div className="flex flex-col sm:flex-row justify-between px-4 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end">
              <ImageUploadArea type="avatar" currentUrl={data.avatarUrl} onUpload={(f) => handleUpload(f, 'avatar')} isUploading={uploadingAvatar} />
              
              <div className="mt-1 sm:mt-0 sm:pb-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.displayName}</h1>
                <p className="text-primary font-semibold">@{data.username}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="mt-4 sm:mt-0 sm:self-end rounded-xl gap-2 font-bold" onClick={() => signOut()}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Top 4 Section */}
        <div className="px-1">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
            <Star className="w-5 h-5 text-primary fill-primary/20" /> My Top 4
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
            {data.topEntries?.map(entry => (
              <TopFourCard key={entry.id} entry={entry} onRemove={() => handleRemoveTopFour(entry.id)} />
            ))}
            {Array.from({ length: Math.max(0, 4 - (data.topEntries?.length || 0)) }).map((_, i) => (
              <EmptyTopFourSlot key={`empty-${i}`} onClick={() => setIsDrawerOpen(true)} />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 px-1">
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Bookmark className="w-5 h-5 text-primary mb-2 opacity-80" />
            <span className="text-xl font-bold">{data.stats.videosSaved}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">Saved</span>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <PlaySquare className="w-5 h-5 text-primary mb-2 opacity-80" />
            <span className="text-xl font-bold">{data.stats.videosWatched}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">Watched</span>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <FolderHeart className="w-5 h-5 text-primary mb-2 opacity-80" />
            <span className="text-xl font-bold">{data.stats.playlistsCreated}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">Lists</span>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="recent" className="w-full mt-8 px-1">
          <TabsList className="flex gap-2 mb-6 bg-secondary/50 p-1.5 rounded-xl w-fit">
            <TabsTrigger 
              value="recent"
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none"
            >
              Recent Saves
            </TabsTrigger>
            <TabsTrigger 
              value="lists"
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground outline-none"
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
              <p className="text-muted-foreground py-8 text-center bg-card rounded-2xl border border-border border-dashed font-medium">No saved videos yet.</p>
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
              <p className="text-muted-foreground py-8 text-center bg-card rounded-2xl border border-border border-dashed font-medium">No public lists.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="h-[80vh] flex flex-col p-0">
          <div className="p-6 border-b border-border shrink-0">
            <h3 className="text-xl font-bold tracking-tight">Select a Tutorial</h3>
            <p className="text-sm text-muted-foreground font-medium mt-1">Choose up to 4 tutorials to feature on your profile.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
            {data.libraryEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Bookmark className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="font-semibold mb-2">No videos in your library</p>
                <p className="text-sm text-muted-foreground">Save some videos to feature them on your profile.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-safe">
                {data.libraryEntries.filter(e => !topEntryIds.includes(e.id)).map(entry => (
                  <button 
                    key={entry.id} 
                    onClick={() => handleAddTopFour(entry.id)} 
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary border border-transparent hover:border-border transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-border group-hover:border-primary/50 transition-colors shadow-sm">
                      <img src={entry.video.thumbnailUrl} className="w-full h-full object-cover" alt={entry.video.title} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-sm line-clamp-1 tracking-tight group-hover:text-primary transition-colors">{entry.video.title}</h4>
                      <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">{entry.video.channelName}</p>
                    </div>
                    <Plus className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                {data.libraryEntries.filter(e => !topEntryIds.includes(e.id)).length === 0 && (
                  <p className="text-center text-muted-foreground font-medium py-10">All your saved videos are already featured!</p>
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </Layout>
  );
}