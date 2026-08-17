import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Danio Cooks</p>
      <nav aria-label="Informazioni legali">
        <Link href="/privacy">Privacy</Link>
        <Link href="/cookie">Cookie</Link>
        <Link href="/termini">Termini d&apos;uso</Link>
        <Link href="/supporto">Supporto</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/istruzioni">Istruzioni</Link>
        <Link href="/supporto#chi-siamo">Chi sono</Link>
      </nav>
    </footer>
  );
}