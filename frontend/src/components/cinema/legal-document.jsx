import Link from 'next/link';
import { ArrowDownToLine } from 'lucide-react';
import styles from './ticket.module.css';

export default function LegalDocument({ content, document, related }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
      <article aria-labelledby="document-title">
        <header className={`${styles.ticket} overflow-hidden`}>
          <div className="space-y-3 px-5 py-5 sm:px-8">
            <h1 id="document-title" className={`${styles.title} text-4xl font-bold leading-tight sm:text-5xl`}>{content.title}</h1>
            <p className="text-sm text-muted-foreground">{content.versionLine}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <a href={document.pdfUrl} download className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4">
                <ArrowDownToLine size={16} aria-hidden="true" /> Baixar PDF original
              </a>
              <Link href={related.url} className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">{related.title}</Link>
            </div>
          </div>
          <div className={styles.tear} aria-hidden="true" />
          <p className={`${styles.stub} px-5 py-5 text-sm leading-relaxed text-muted-foreground sm:px-8`}>{content.note}</p>
        </header>
        <div className="mt-8 grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(14rem,1fr)_minmax(0,2.7fr)] lg:gap-10">
          <nav aria-labelledby="sumario" className="min-w-0 rounded-md border border-border bg-card p-4 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
            <h2 id="sumario" className="scroll-mt-24 font-bold">Sumário</h2>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {content.sections.map(section => <li key={section.id}>
                <a href={`#${section.id}`} className="flex min-h-10 items-center rounded px-2 py-1.5 text-sm text-primary underline-offset-4 hover:bg-muted hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                  {section.title}
                </a>
              </li>)}
            </ul>
          </nav>
          <div className="min-w-0 space-y-10">
            {content.sections.map(section => (
              <section key={section.id} aria-labelledby={section.id} className="min-w-0 space-y-4 border-b border-dashed border-border pb-7">
                <h2 id={section.id} className={`${styles.title} scroll-mt-24 text-3xl font-bold sm:text-4xl`}>{section.title}</h2>
                {section.blocks.map((block, index) => block.kind === 'heading'
                  ? <h3 key={index} className="pt-2 text-lg font-bold">{block.text}</h3>
                  : block.kind === 'table' ? <DocumentTable key={index} block={block} title={section.title} />
                  : block.kind === 'list' ? <ul key={index} className="max-w-[72ch] list-disc space-y-2 ps-6 leading-[1.75]">
                    {block.items.map((item, itemIndex) => <li key={itemIndex} className="break-words">{item}</li>)}
                  </ul>
                  : <p key={index} className="max-w-[72ch] break-words leading-[1.75]">{block.text}</p>)}
                <a href="#sumario" className="inline-flex min-h-10 items-center text-sm text-primary underline underline-offset-4 lg:hidden">Voltar ao sumário</a>
              </section>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}

function DocumentTable({ block, title }) {
  return <div>
    <p className="mb-2 text-sm text-muted-foreground sm:hidden">Deslize a tabela para ver todas as colunas.</p>
    <div className="max-w-full overflow-auto rounded-md border border-border focus-visible:outline-2 focus-visible:outline-ring"
      role="region" aria-label={`Tabela de ${title}`} tabIndex={0}>
      <table className="w-full border-collapse text-left text-sm leading-relaxed">
        <caption className="sr-only">{title}</caption>
        <thead className="bg-muted">
          <tr>{block.columns.map(column => <th key={column} scope="col" className="min-w-28 px-3 py-2.5">{column}</th>)}</tr>
        </thead>
        <tbody>{block.rows.map((row, index) => <tr key={index} className="border-t border-border align-top">
          <th scope="row" className="px-3 py-2.5 font-semibold">{row[0]}</th>
          {row.slice(1).map((cell, column) => <td key={column} className="px-3 py-2.5">{cell}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
