"use client";

import { useMemo, useState } from "react";
import { categories } from "@/components/support/data";

// Keep question IDs stable while filtering the displayed answers.
const indexedCategories = categories.map((category) => ({
  ...category,
  questions: category.questions.map((question, index) => ({
    ...question,
    id: `${category.id}-${index}`,
  })),
}));

export default function useSupportCenter() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [openQuestion, setOpenQuestion] = useState("ingressos-0");

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return indexedCategories
      .filter((category) => activeCategory === "todos" || category.id === activeCategory)
      .map((category) => ({
        ...category,
        openQuestions: openQuestion.startsWith(`${category.id}-`) ? [openQuestion] : [],
        questions: category.questions.filter((item) =>
          !term || `${category.label} ${item.q} ${item.a}`.toLowerCase().includes(term)
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [search, activeCategory, openQuestion]);

  const changeSearch = (event) => setSearch(event.target.value);
  const clearSearch = () => setSearch("");
  const changeQuestion = (values) => setOpenQuestion(values[0] ?? "");
  const resetFilters = () => { setSearch(""); setActiveCategory("todos"); };
  // The assistant remains a visual placeholder, without message delivery.
  const submitAssistantQuestion = (event) => event.preventDefault();

  return { search, changeSearch, clearSearch, activeCategory, setActiveCategory, filteredCategories, changeQuestion, resetFilters, submitAssistantQuestion };
}
