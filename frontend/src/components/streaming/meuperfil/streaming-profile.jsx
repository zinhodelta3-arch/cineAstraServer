"use client";

import useStreamingProfile from "@/hooks/streaming/meuperfil/use-streaming-profile";
import { Play, Plus, Check, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TRAILER, CONTINUE, PROGRESS, RECOMMENDED } from "./data";
import Row from "./row";
import EmptyRow from "./empty-row";
import Card from "./card";
import RoundBtn from "./round-btn";
import EditForm from "./edit-form";
import ProfileStyles from "./profile-styles";
import ProfileHeader from "./profile-header";

export default function PerfilPage() {
  const { profile, editing, setEditing, list, trailers, trailerOpen, tab, setTab, saveProfile, toggleList, openTrailer, myListFilms, watchedTrailers, show, openEditor, closeEditor, changeTrailerOpen } = useStreamingProfile();

  const playBtn = (m) => <RoundBtn label={`Assistir ${m.title}`} solid onClick={() => openTrailer(m)}><Play className="size-4 fill-current" /></RoundBtn>;
  const listBtn = (m) => (
    <RoundBtn label={list.includes(m.id) ? "Remover da lista" : "Adicionar à lista"} onClick={() => toggleList(m)}>
      {list.includes(m.id) ? <Check className="size-4" /> : <Plus className="size-4" />}
    </RoundBtn>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <ProfileStyles />

      <main className="max-w-[1800px] mx-auto px-5 md:px-12 pt-28 pb-24">
        {/* CABEÇALHO — ingresso simples */}
        <ProfileHeader profile={profile} list={list} trailers={trailers} openEditor={openEditor} />

        {/* FILTRO DAS FILEIRAS */}
        <Tabs value={tab} onValueChange={setTab} className="mt-10">
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              ["all", "Tudo"], ["continue", "Continuar assistindo"], ["list", "Minha lista"],
              ["rec", "Recomendados"], ["trailers", "Trailers assistidos"],
            ].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="rounded-full border border-border px-4 py-1.5 text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* FILEIRAS */}
        <div className="mt-4">
          {show("continue") && (
            <Row title="Continuar assistindo">
              {CONTINUE.map((m) => (
                <Card key={m.id} movie={m} progress={PROGRESS[m.id]} meta={`${PROGRESS[m.id]}%`} onOpen={openTrailer} actions={<>{playBtn(m)}{listBtn(m)}</>} />
              ))}
            </Row>
          )}

          {show("list") && (
            <Row title="Minha lista">
              {myListFilms.length === 0 ? (
                <EmptyRow>Sua lista está vazia. Adicione filmes nas recomendações para assistir depois.</EmptyRow>
              ) : (
                myListFilms.map((m) => (
                  <Card key={m.id} movie={m} onOpen={openTrailer} actions={<>{playBtn(m)}<RoundBtn label={`Remover ${m.title} da lista`} onClick={() => toggleList(m)}><Trash2 className="size-4" /></RoundBtn></>} />
                ))
              )}
            </Row>
          )}

          {show("rec") && (
            <Row title="Recomendados para você" hint="Com base nos filmes que você assistiu e salvou.">
              {RECOMMENDED.map((m) => (
                <Card key={m.id} movie={m} onOpen={openTrailer} actions={<>{playBtn(m)}{listBtn(m)}</>} />
              ))}
            </Row>
          )}

          {show("trailers") && (
            <Row title="Trailers assistidos">
              {watchedTrailers.map((m) => (
                <Card key={m.id} movie={m} meta={m.when} label={`Rever trailer de ${m.title}`} onOpen={openTrailer} actions={<>{playBtn(m)}{listBtn(m)}</>} />
              ))}
            </Row>
          )}
        </div>
      </main>

      {/* EDITAR PERFIL */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="ticket max-w-xl gap-5 bg-card border-border sm:rounded-xl">
          {editing && <EditForm profile={profile} onSave={saveProfile} onCancel={closeEditor} />}
        </DialogContent>
      </Dialog>

      {/* TRAILER */}
      <Dialog open={!!trailerOpen} onOpenChange={changeTrailerOpen}>
        <DialogContent className="max-w-5xl bg-card border-border p-3 sm:rounded-lg">
          <DialogHeader className="px-2 pt-2">
            <DialogTitle className="f-display text-3xl font-black">{trailerOpen?.title}</DialogTitle>
            <DialogDescription>Trailer</DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
            {trailerOpen && (
              <iframe src={`${TRAILER}?autoplay=1`} title={`Trailer de ${trailerOpen.title}`} className="size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
