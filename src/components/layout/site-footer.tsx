import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30 py-6 text-center text-xs text-muted-foreground">
      <p>
        Editorial — demo UI.{" "}
        <Link to="/pub/stack-journal" className="underline underline-offset-2">
          The Stack Journal
        </Link>
      </p>
    </footer>
  );
}
