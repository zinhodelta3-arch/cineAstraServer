"use client";

import useStreamingHome from "@/hooks/streaming/home/use-streaming-home";
import Button from "@/components/streaming/home/button";
import Row from "@/components/streaming/home/row";
import Thumb from "@/components/streaming/home/thumb";
import DetailsModal from "@/components/streaming/home/details-modal";
import PlayerModal from "@/components/streaming/home/player-modal";
import CinemaStyles from "@/components/streaming/home/cinema-styles";
import ProfileHeader from "./profile-header";

export default function StreamingProfile() {
  const state = useStreamingHome();
  const { ready, error, actionError, retry, profile, history, catalog, continuing, recent, explore, myList, favoriteIds, toggleList, progress, accessByFilm, updateProgress, playing, setPlaying, details, setDetails, closePlayer, closeDetails } = state;
  const card = (movie) => <Thumb key={movie.id} movie={movie} onSelect={setDetails} onPlay={setPlaying} inList={favoriteIds.has(movie.id)} onToggleList={toggleList} progress={progress[movie.id]} />;
  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <CinemaStyles />
      <main className="max-w-[1800px] mx-auto px-5 md:px-12 pt-28 pb-24">
        {!ready ? <div role={error ? "alert" : "status"}><p>{error || "Carregando seu perfil..."}</p>{error && <Button className="mt-4" onClick={retry}>Tentar novamente</Button>}</div> : <>
          <ProfileHeader profile={profile} favorites={favoriteIds.size} history={history} />
          {actionError && <p role="alert" className="mt-5 text-sm text-destructive">{actionError}</p>}
          <div className="mt-10 space-y-4">
            {continuing.length > 0 && <Row title="Continuar assistindo">{continuing.map(card)}</Row>}
            <Row title="Minha lista">{myList.length ? myList.map(card) : <p className="text-sm text-muted-foreground">Sua lista está vazia. Salve filmes no catálogo para encontrá-los aqui.</p>}</Row>
            {recent.length > 0 && <Row title="Histórico de filmes">{recent.map(card)}</Row>}
            {explore.length > 0 && <Row title="Explore mais filmes">{explore.map(card)}</Row>}
          </div>
        </>}
      </main>
      {ready && details && <DetailsModal key={details.id} movie={details} onClose={closeDetails} onPlay={setPlaying} inList={favoriteIds.has(details.id)} onToggleList={toggleList} catalog={catalog} progress={progress} />}
      {ready && playing && <PlayerModal movie={playing} profileId={profile.id} access={accessByFilm[playing.id]} onProgress={updateProgress} onClose={closePlayer} />}
    </div>
  );
}
