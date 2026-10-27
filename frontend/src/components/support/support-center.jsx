"use client";

import useSupportCenter from "@/hooks/cinema/suporte/use-support-center";
import SupportHeader from "./support-header";
import SupportFaq from "./support-faq";
import SupportAssistant from "./support-assistant";

export default function SupportCenter() {
  const { search, changeSearch, clearSearch, submitAssistantQuestion, ...faq } = useSupportCenter();

  return (
    <main className="relative min-h-[calc(100svh-81px)] overflow-hidden bg-background px-3 pt-[30px] pb-[60px] text-foreground min-[601px]:px-5 min-[601px]:pt-[42px] min-[601px]:pb-20">
      <SupportHeader search={search} changeSearch={changeSearch} clearSearch={clearSearch} />
      <SupportFaq {...faq} />
      <SupportAssistant submitAssistantQuestion={submitAssistantQuestion} />
    </main>
  );
}
