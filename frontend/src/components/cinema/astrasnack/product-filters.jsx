"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "./data";

export default function ProductFilters({ snack }) {
  const { category, setCategory, query, setQuery } = snack;
  return (
        <div className="mb-7 flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {CATEGORIES.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={category === item.id ? "default" : "ghost"}
                onClick={() => setCategory(item.id)}
                className="shrink-0 rounded-full"
              >
                {item.label}
              </Button>
            ))}
          </div>

          <label className="flex h-9 w-full items-center gap-2 rounded-full border border-border bg-card px-3 text-muted-foreground lg:max-w-xs">
            <Search className="size-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar produtos..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </label>
        </div>
  );
}
