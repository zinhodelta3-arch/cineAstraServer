import { Suspense } from "react";
import StreamingCategories from "@/components/streaming/categories/streaming-categories";

export const metadata = { title: "Categorias | CineAstra Streaming" };

export default function CategoriesPage() {
  return <Suspense fallback={<p role="status" className="p-8 text-muted-foreground">Carregando categorias…</p>}>
    <StreamingCategories />
  </Suspense>;
}
