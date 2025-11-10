export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-zinc-600 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} Video University. Built with Next.js.</p>
        <div className="flex gap-4">
          <a
            href="https://nextjs.org/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-zinc-900"
          >
            Next.js
          </a>
          <a
            href="https://tailwindcss.com/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-zinc-900"
          >
            Tailwind CSS
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-zinc-900"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
