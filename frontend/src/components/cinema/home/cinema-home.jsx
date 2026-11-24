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
import { useRouter } from 'next/navigation';
export default function CinemaHome() {
 const { catalog, upcoming, presale, highlights, movies, comingSoon, presales, bookingMovie, setBookingMovie } = useCinemaHome();
 const router=useRouter();
 function selectMovie(movie){
  if(movie.onSale)setBookingMovie(movie);
  else router.push(`/cinema/filmes/${encodeURIComponent(movie.slug??movie.id)}`);
 }
 const featuredMovies = highlights.items.map(filmCard);
 return <div className="ca-root min-h-screen bg-background text-foreground transition-colors duration-300">
  <CinemaStyles />
  {!highlights.loading && <HeroSection movies={(featuredMovies.length ? featuredMovies : movies).slice(0, 4)} onSelectMovie={selectMovie} />}
  {!featuredMovies.length && !movies.length && <header className="mx-auto max-w-[1600px] px-5 pt-16"><h1 className="f-display text-5xl font-black">Seu próximo filme começa aqui.</h1><p className="mt-4 text-muted-foreground">Explore o catálogo e consulte a programação do seu cinema.</p></header>}
  <div className="bg-background py-8">
   {movies.length > 0 && <MovieCarousel id="em-cartaz" title="No catálogo" movies={movies} onSelectMovie={selectMovie} />}
   {presales.length > 0 && <MovieCarousel id="pre-venda" title="Pré-venda" movies={presales} soon onSelectMovie={selectMovie} />}
   {comingSoon.length > 0 && <MovieCarousel id="em-breve" title="Em breve" movies={comingSoon} soon onSelectMovie={selectMovie} />}
   <div className="mx-auto max-w-[1600px] px-5 md:px-8"><ListStatus list={catalog} empty="Nenhum filme de cinema publicado no momento." showMore={false} /></div>
   {[upcoming,presale].map((list,index)=>(list.loading || list.error) && <div key={index} className="mx-auto max-w-[1600px] px-5 md:px-8"><ListStatus list={list} empty="" showMore={false}/></div>)}
  </div>
  {featuredMovies.length > 0 && <><SectionDivider/><MovieCarousel id="destaques" title="Destaques" movies={featuredMovies} onSelectMovie={selectMovie} /></>}
  {highlights.error && <div className="mx-auto max-w-[1600px] px-5 md:px-8"><ListStatus list={highlights} empty="" /></div>}
  <HomeContentSection kind="banners" />
  <SectionDivider /><HomeContentSection />
  <SectionDivider /><CombosSection />
  {bookingMovie && <SessionListModal key={bookingMovie.id} movie={bookingMovie} onClose={() => setBookingMovie(null)} />}
 </div>;
}
