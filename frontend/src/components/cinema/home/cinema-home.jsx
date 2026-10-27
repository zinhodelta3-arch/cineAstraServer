"use client";
import { SectionDivider } from './home-ui';
import CinemaStyles from './cinema-styles';
import HeroSection from './hero-section';
import MovieCarousel from './movie-carousel';
import HomeContentSection from './home-content-section';
import CombosSection from './combos-section';
import SessionListModal from './session-list-modal';
import ListStatus from './list-status';
import { useCinemaHome } from '@/hooks/cinema/home/use-cinema-home';
export default function CinemaHome() {
 const { catalog, movies, nowPlaying, comingSoon, bookingMovie, setBookingMovie } = useCinemaHome();
 return <div className="ca-root min-h-screen bg-background text-foreground transition-colors duration-300">
  <CinemaStyles />
  <HeroSection movies={movies.slice(0,4)} onSelectMovie={setBookingMovie} />
  {!movies.length && <header className="mx-auto max-w-[1600px] px-5 pt-16"><h1 className="f-display text-5xl font-black">Seu próximo filme começa aqui.</h1><p className="mt-4 text-muted-foreground">Explore o catálogo e consulte a programação do seu cinema.</p></header>}
  <div className="bg-background py-8">
   {nowPlaying.length > 0 && <MovieCarousel id="em-cartaz" title="No catálogo" movies={nowPlaying} onSelectMovie={setBookingMovie} />}
   {comingSoon.length > 0 && <MovieCarousel id="em-breve" title="Em breve" movies={comingSoon} soon onSelectMovie={setBookingMovie} />}
   <div className="mx-auto max-w-[1600px] px-5 md:px-8"><ListStatus list={catalog} empty="Nenhum filme de cinema publicado no momento." more="Carregar mais filmes" /></div>
  </div>
  <SectionDivider /><HomeContentSection kind="banners" />
  <SectionDivider /><HomeContentSection />
  <SectionDivider /><CombosSection />
  {bookingMovie && <SessionListModal key={bookingMovie.id} movie={bookingMovie} onClose={() => setBookingMovie(null)} />}
 </div>;
}
