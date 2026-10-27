"use client";

import { MapPin } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CINEMAS } from "./movies";
import { SECTIONS } from "./movie-utils";
import styles from "./filmes.module.css";

export default function CatalogNavigation({ cinema, onCinemaChange }) {
  return (
          <div className="flex flex-col justify-between gap-5 pb-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
              <Select items={CINEMAS} value={cinema} onValueChange={onCinemaChange}>
                <SelectTrigger aria-label="Selecionar cinema" className="h-10 w-[230px] rounded-full border-border bg-card px-4 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{CINEMAS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <TabsList className="grid h-11 w-full grid-cols-3 rounded-none border-b border-border/60 bg-transparent p-0 sm:w-auto sm:min-w-[390px]">
              {SECTIONS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}
                  className={`${styles.tab} h-11 rounded-none border-0 bg-transparent px-4 text-sm font-bold text-muted-foreground shadow-none hover:text-foreground data-[active]:bg-transparent data-[active]:text-primary data-[active]:shadow-none`}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
  );
}
