import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  children: React.ReactNode;
};

export function LegalPage({ eyebrow, title, updatedAt, children }: LegalPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Torna al ricettario
        </Link>
        <header className="legal-page-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>Aggiornata il {updatedAt}.</p>
        </header>
        <article className="legal-content">{children}</article>
      </main>
      <SiteFooter />
    </>
  );
}