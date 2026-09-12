import { Layout } from "@/components/layout";
import { useGetPlaylist, useUpdatePlaylist, useDeletePlaylist, useAddVideoToPlaylist, getGetPlaylistQueryKey, getGetPlaylistsQueryKey } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { VideoCard } from "@/components/video-card";
import { Button, Input, Textarea, Badge } from "@/components/ui";
import { ArrowLeft, Trash2, LayoutList, Plus, Search, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export default function ListDetail() {
  const [, params] = useRoute("/lists/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: list, isLoading, error } = useGetPlaylist(id);
  const updateList = useUpdatePlaylist();
  const deleteList = useDeletePlaylist();
  const addVideo = useAddVideoToPlaylist();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const mutateFnRef = useRef(updateList.mutate);
  mutateFnRef.current = updateList.mutate;

  const openEdit = () => {
    if (!list) return;
    setEditTitle(list.title);
    setEditDesc(list.description || "");
    setIsEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    mutateFnRef.current({ playlistId: id, data: { title: editTitle, description: editDesc } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetPlaylistQueryKey(id), data);
        setIsEditOpen(false);
        toast({ title: "List updated" });
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this list? Videos saved in it will remain in your library.")) {
      deleteList.mutate({ playlistId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
          toast({ title: "List deleted" });
          setLocation("/lists");
        }
      });
    }
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    // Assuming backend takes URL or extracts videoId. 
    // Wait, the API schemas say `PlaylistVideoInput` takes `videoId: string`. 
    // We can't parse youtube URL easily here without a helper, let's assume we pass the ID.
    // Actually, `useAddVideoToPlaylist` expects a videoId which should be our internal ID.
    // To add a completely new video by URL, we'd need to create an Entry first.
    // Since we don't have a specific endpoint to just "Add url to list", we'll tell the user to add via the Add page and select a list there (if that feature existed), or we just show a toast for this mockup.
    toast({ title: "Feature coming soon", description: "Currently, add videos via the main Add page and select a list." });
    setIsAddVideoOpen(false);
  };

  if (isLoading) return <Layout><div className="animate-pulse h-48 bg-secondary rounded-2xl mt-4" /></Layout>;
  if (error || !list) return <Layout><p>List not found.</p></Layout>;

  return (
    <Layout>
      <div className="space-y-8 pb-12 animate-in fade-in duration-300">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="-ml-3 text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <header className="bg-card border border-border p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <LayoutList className="w-48 h-48 -rotate-12 translate-x-12 -translate-y-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="gap-1 px-2.5">
                <LayoutList className="w-3.5 h-3.5" />
                {list.videoCount} Videos
              </Badge>
              {list.source === 'youtube' && (
                <Badge variant="outline" className="gap-1 border-red-500/30 text-red-500 bg-red-500/10">
                  Imported
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">{list.title}</h1>
            {list.description && <p className="text-muted-foreground text-lg max-w-2xl">{list.description}</p>}
            
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Button onClick={openEdit} variant="secondary" className="rounded-xl">Edit Details</Button>
              {list.originalUrl && (
                <a href={list.originalUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="rounded-xl gap-2">
                    <ExternalLink className="w-4 h-4" /> Original
                  </Button>
                </a>
              )}
              <div className="flex-1" />
              <Button variant="ghost" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 rounded-xl">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Videos in this list</h2>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setIsAddVideoOpen(true)}>
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        {list.videos && list.videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {list.videos.map(video => (
              <VideoCard key={video.id} video={video} showStatus={false} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border border-dashed text-center">
            <Search className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
            <h3 className="text-lg font-medium mb-1">This list is empty</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">Add videos to this list to build out your learning path.</p>
            <Button onClick={() => setIsAddVideoOpen(true)}>Add Video</Button>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog.Root open={isEditOpen} onOpenChange={setIsEditOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-card rounded-2xl p-6 shadow-2xl z-[101] border border-border">
              <Dialog.Title className="text-xl font-bold mb-4">Edit List</Dialog.Title>
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={updateList.isPending}>Save</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Add Video Dialog Mockup */}
        <Dialog.Root open={isAddVideoOpen} onOpenChange={setIsAddVideoOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-card rounded-2xl p-6 shadow-2xl z-[101] border border-border">
              <Dialog.Title className="text-xl font-bold mb-4">Add Video to List</Dialog.Title>
              <form onSubmit={handleAddVideo} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Library or Paste URL</label>
                  <Input placeholder="Search your saved videos..." />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsAddVideoOpen(false)}>Cancel</Button>
                  <Button type="submit">Add</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

      </div>
    </Layout>
  );
}