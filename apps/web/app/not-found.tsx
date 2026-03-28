import Link from "next/link";
import { Logo } from "@workspace/ui/components/ui/logo";
import { Button } from "@workspace/ui/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link
              href="/"
              className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
            >
              <Logo size="md" className="text-foreground" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-md mx-auto">
          {/* 404 Icon/Illustration */}
          <div className="mb-8">
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 text-primary">
              <span className="text-4xl font-bold tracking-tight">404</span>
              {/* Decorative elements */}
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-primary/30" />
            </div>
          </div>

          {/* Text content */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Page not found
          </h1>
          <p className="text-muted-foreground text-base mb-8 leading-relaxed">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/">Go back home</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>

          {/* Helpful links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Popular pages
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/people"
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                People
              </Link>
              <Link
                href="/deals"
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                Deals
              </Link>
              <Link
                href="/sequences"
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                Sequences
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Need help? Contact{" "}
            <a
              href="mailto:support@verio.com"
              className="text-primary hover:underline"
            >
              support@verio.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
