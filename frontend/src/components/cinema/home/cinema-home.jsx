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
import { filmCard } from '@/lib/api/public-api.mjs';
export default function CinemaHome() {
 const { catalog, popular, movies, nowPlaying, comingSoon, bookingMovie, setBookingMovie } = useCinemaHome();
 const featuredMovies = popular.items.map(filmCard);
 return <div className="ca-root min-h-screen bg-background text-foreground transition-colors duration-300">
  <CinemaStyles />
  <HeroSection movies={(featuredMovies.length ? featuredMovies : [...nowPlaying].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || '')).slice(0, 4))} onSelectMovie={setBookingMovie} />
  {!movies.length && <header className="mx-auto max-w-[1600px] px-5 pt-16"><h1 className="f-display text-5xl font-black">Seu próximo filme começa aqui.</h1><p className="mt-4 text-muted-foreground">Explore o catálogo e consulte a programação do seu cinema.</p></header>}
  <div className="bg-background py-8">
   {nowPlaying.length > 0 && <MovieCarousel id="em-cartaz" title="No catálogo" movies={nowPlaying} onSelectMovie={setBookingMovie} />}
   {comingSoon.length > 0 && <MovieCarousel id="em-breve" title="Em breve" movies={comingSoon} soon onSelectMovie={setBookingMovie} />}
   <div className="mx-auto max-w-[1600px] px-5 md:px-8"><ListStatus list={catalog} empty="Nenhum filme de cinema publicado no momento." more="Carregar mais filmes" /></div>
  </div>
  <SectionDivider />
  <div className="bg-background py-8"><MovieCarousel id="destaques" title="Destaques" movies={featuredMovies} onSelectMovie={setBookingMovie} /><div className="mx-auto max-w-[1600px] px-5 md:px-8"><ListStatus list={popular} empty="Nenhum filme assistido para destacar ainda." /></div></div>
  <SectionDivider /><HomeContentSection />
  <SectionDivider /><CombosSection />
  {bookingMovie && <SessionListModal key={bookingMovie.id} movie={bookingMovie} onClose={() => setBookingMovie(null)} />}
 </div>;
}
