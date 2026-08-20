import Link from "next/link";
import { Tooltip } from "@/components/tooltip";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Danio Cooks</p>
      <nav aria-label="Informazioni legali">
        <Tooltip content="Leggi come vengono gestiti dati e conversazioni."><Link href="/privacy">Privacy</Link></Tooltip>
        <Tooltip content="Consulta le informazioni sui cookie del sito."><Link href="/cookie">Cookie</Link></Tooltip>
        <Tooltip content="Leggi le condizioni per l’uso del sito."><Link href="/termini">Termini d&apos;uso</Link></Tooltip>
        <Tooltip content="Trova i riferimenti per ricevere supporto."><Link href="/supporto">Supporto</Link></Tooltip>
        <Tooltip content="Consulta le risposte alle domande più frequenti."><Link href="/faq">FAQ</Link></Tooltip>
        <Tooltip content="Leggi le istruzioni pratiche per usare il sito."><Link href="/istruzioni">Istruzioni</Link></Tooltip>
        <Tooltip content="Scopri chi cura il progetto e il metodo editoriale."><Link href="/supporto#chi-siamo">Chi sono</Link></Tooltip>
      </nav>
    </footer>
  );
}