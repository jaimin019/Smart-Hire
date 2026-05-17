export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-6 text-[12px] text-text-muted">
        <span>Built with LangGraph · FastAPI · React · Sentence-Transformers</span>
        <span>© {new Date().getFullYear()} Smart Hire</span>
      </div>
    </footer>
  );
}
