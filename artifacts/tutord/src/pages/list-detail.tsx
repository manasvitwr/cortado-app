import { Layout } from "@/components/layout";
import { useGetPlaylist, useUpdatePlaylist, useDeletePlaylist, useAddVideoToPlaylist, getGetPlaylistQueryKey, getGetPlaylistsQueryKey } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { VideoCard } from "@/components/video-card";
import { Button, Input, Textarea, Badge } from "@/components/ui";
import { ArrowLeft, Trash2, LayoutList, Plus, Search, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
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
  const addVideo = useAddVideoToPlaylist(); // Preserved API hook

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);

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
    toast({ title: "Feature coming soon", description: "Currently, add videos via the main Add page and select a list." });
    setIsAddVideoOpen(false);
  };

  if (isLoading) return <Layout><div className="animate-pulse h-48 bg-secondary rounded-[2rem] mt-4 w-full" /></Layout>;
  if (error || !list) return <Layout><p className="p-8 text-center text-destructive font-bold bg-card rounded-[2rem] mt-4 border border-border shadow-xl">List not found.</p></Layout>;

  return (
    <Layout>
      <div className="space-y-8 pb-12 animate-in fade-in duration-300 w-full">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="-ml-3 text-muted-foreground hover:text-foreground font-bold h-10 px-4 rounded-xl">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </Button>

        <header className="bg-card border border-border p-6 sm:p-8 rounded-[2rem] relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <LayoutList className="w-64 h-64 -rotate-12 translate-x-12 -translate-y-12 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm border-border bg-background/50">
                <LayoutList className="w-4 h-4 text-primary" />
                {list.videoCount} Videos
              </Badge>
              {list.source === 'youtube' && (
                <Badge variant="outline" className="gap-1.5 border-red-500/30 text-red-500 bg-red-500/10 px-3 py-1 text-sm font-bold">
                  Imported
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 leading-tight">{list.title}</h1>
            {list.description && <p className="text-muted-foreground text-base font-medium max-w-2xl leading-relaxed">{list.description}</p>}
            
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Button onClick={openEdit} variant="secondary" className="rounded-xl font-bold h-11 px-5 border border-border">Edit Details</Button>
              {list.originalUrl && (
                <a href={list.originalUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="rounded-xl gap-2 font-bold h-11 px-5 border-border">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" /> Original
                  </Button>
                </a>
              )}
              <div className="flex-1" />
              <Button variant="ghost" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 rounded-xl h-11 w-11 p-0 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-bold tracking-tight">Videos in this list</h2>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl font-bold h-10 px-4 border-border shadow-sm" onClick={() => setIsAddVideoOpen(true)}>
            <Plus className="w-4 h-4" strokeWidth={3} /> Add
          </Button>
        </div>

        {list.videos && list.videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-1">
            {list.videos.map(video => (
              <VideoCard key={video.id} video={video} showStatus={false} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-[2rem] border border-border border-dashed text-center shadow-sm">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-muted-foreground opacity-70" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2">This list is empty</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-8 font-medium">Add videos to this list to build out your learning path.</p>
            <Button onClick={() => setIsAddVideoOpen(true)} className="rounded-xl font-bold h-12 px-8 shadow-lg shadow-primary/20">Add Video</Button>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog.Root open={isEditOpen} onOpenChange={setIsEditOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-card rounded-[2rem] p-6 sm:p-8 shadow-2xl z-[101] border border-border outline-none">
              <Dialog.Title className="text-2xl font-bold mb-6 tracking-tight">Edit List</Dialog.Title>
              <form onSubmit={handleEdit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Title</label>
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="h-12 rounded-xl bg-input border-border text-base" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Description</label>
                  <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="min-h-[120px] rounded-xl bg-input border-border text-base resize-none" />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl font-bold h-12 px-6">Cancel</Button>
                  <Button type="submit" isLoading={updateList.isPending} className="rounded-xl font-bold h-12 px-8 shadow-lg shadow-primary/20">Save</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Add Video Dialog */}
        <Dialog.Root open={isAddVideoOpen} onOpenChange={setIsAddVideoOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-card rounded-[2rem] p-6 sm:p-8 shadow-2xl z-[101] border border-border outline-none">
              <Dialog.Title className="text-2xl font-bold mb-6 tracking-tight">Add Video to List</Dialog.Title>
              <form onSubmit={handleAddVideo} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Search Library or Paste URL</label>
                  <Input placeholder="Search your saved videos..." className="h-12 rounded-xl bg-input border-border text-base" />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <Button type="button" variant="ghost" onClick={() => setIsAddVideoOpen(false)} className="rounded-xl font-bold h-12 px-6">Cancel</Button>
                  <Button type="submit" className="rounded-xl font-bold h-12 px-8 shadow-lg shadow-primary/20">Add</Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

      </div>
    </Layout>
  );
}