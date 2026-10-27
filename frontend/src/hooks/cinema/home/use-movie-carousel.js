"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export function useMovieCarousel(movies) {
  const ref = useRef(null);
  const [controlsReady, setControlsReady] = useState(false);
  const [navigation, setNavigation] = useState({
    page: 0,
    pages: 1,
    canGoBack: false,
    canGoNext: false,
  });
  const { page, pages, canGoBack, canGoNext } = navigation;

  const update = useCallback(() => {
    const el = ref.current;
    if (!el || el.clientWidth <= 0) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const step = el.clientWidth * 0.9;
    const scrollLeft = Math.min(maxScroll, Math.max(0, el.scrollLeft));
    const totalPages = maxScroll > 1 ? Math.ceil(maxScroll / step) + 1 : 1;
    const currentPage = maxScroll > 1
      ? Math.round((scrollLeft / maxScroll) * (totalPages - 1))
      : 0;

    const next = {
      page: currentPage,
      pages: totalPages,
      canGoBack: scrollLeft > 1,
      canGoNext: maxScroll - scrollLeft > 1,
    };

    setControlsReady(true);
    setNavigation((previous) => {
      if (
        previous.page === next.page &&
        previous.pages === next.pages &&
        previous.canGoBack === next.canGoBack &&
        previous.canGoNext === next.canGoNext
      ) return previous;
      return next;
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(update);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update, movies]);

  const go = (direction) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.9,
      behavior: "smooth",
    });
  };

  const goTo = (index) => {
    const el = ref.current;
    if (!el || pages <= 1) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    el.scrollTo({
      left: (maxScroll / (pages - 1)) * index,
      behavior: "smooth",
    });
  };

  return { ref, controlsReady, page, pages, canGoBack, canGoNext, update, go, goTo };
}
