import { Layout } from "@/components/layout";
import { useGetPlaylists, useCreatePlaylist, getGetPlaylistsQueryKey } from "@workspace/api-client-react";
import { ListCard, ListCardSkeleton } from "@/components/list-card";
import { Button, Input, Textarea } from "@/components/ui";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutList, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";

export default function Lists() {
  const { data: playlists, isLoading, error } = useGetPlaylists();
  const createPlaylist = useCreatePlaylist();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    createPlaylist.mutate({ data: { title: newTitle, description: newDesc } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlaylistsQueryKey() });
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDesc("");
        toast({ title: "List created" });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create list.", variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <LayoutList className="w-8 h-8 text-primary" />
              Lists
            </h1>
            <p className="text-muted-foreground mt-2">Organize your learning paths.</p>
          </div>
          
          <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Dialog.Trigger asChild>
              <Button className="rounded-full gap-2 hidden sm:flex">
                <Plus className="w-4 h-4" /> Create List
              </Button>
            </Dialog.Trigger>
            <Button size="icon" className="rounded-full sm:hidden" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-5 h-5" />
            </Button>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-card rounded-2xl p-6 shadow-2xl z-[101] animate-in zoom-in-95 duration-200 border border-border">
                <Dialog.Title className="text-xl font-bold mb-4">Create new list</Dialog.Title>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="e.g. Next.js Masterclass" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Description (Optional)</label>
                    <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What's this list about?" />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" isLoading={createPlaylist.isPending}>Create</Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map(i => <ListCardSkeleton key={i} />)}
          </div>
        ) : error || !playlists ? (
          <div className="p-8 bg-card rounded-2xl border border-border text-center">
            <p className="text-destructive font-medium">Failed to load lists.</p>
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-card rounded-2xl border border-border border-dashed my-8">
            <LayoutList className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No lists yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              Create a custom list to organize your videos, or paste a YouTube playlist URL in the Add tab to import it.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>Create List</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {playlists.map(list => (
              <ListCard key={list.id} playlist={list} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}