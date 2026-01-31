export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} Video Learning. Built with Next.js.</p>
        <div className="flex gap-4">
          <a
            href="https://nextjs.org/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-foreground"
          >
            Next.js
          </a>
          <a
            href="https://tailwindcss.com/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-foreground"
          >
            Tailwind CSS
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
