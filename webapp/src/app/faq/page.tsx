import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "FAQ | Danio Cooks",
  description: "Domande frequenti di Danio Cooks.",
};

export default function FaqPage() {
  return (
    <LegalPage eyebrow="Supporto" title="FAQ" updatedAt="17 agosto 2026">
      <p>Questa sezione è in costruzione.</p>
    </LegalPage>
  );
}
