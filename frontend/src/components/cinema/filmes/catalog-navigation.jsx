"use client";
import {TabsList,TabsTrigger} from '@/components/ui/tabs';
import {SECTIONS} from './movie-utils';
import styles from './filmes.module.css';
export default function CatalogNavigation(){
 return <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
  <p className="text-sm text-muted-foreground">Escolha o cinema ao consultar as sessões.</p>
  <TabsList className="grid h-11 w-full grid-cols-2 rounded-none border-b border-border/60 bg-transparent p-0 sm:w-auto sm:min-w-[280px]">
   {SECTIONS.map(item=><TabsTrigger key={item.value} value={item.value} className={`${styles.tab} h-11 rounded-none px-4 text-sm font-bold`}>{item.label}</TabsTrigger>)}
  </TabsList>
 </div>;
}
