"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/ui/button";
import { ThemeToggle } from "@workspace/ui/components/ui/theme-toggle";
import { Logo } from "@workspace/ui/components/ui/logo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <nav
          className={cn(
            "mt-4 mx-0 sm:mx-4 rounded-xl border border-border/50 bg-background/80 backdrop-blur-lg transition-shadow duration-200",
            scrolled && "shadow-md",
          )}
        >
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left: Logo */}
            <Link
              href="/"
              className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
            >
              <Logo size="lg" className="text-foreground" />
            </Link>

            {/* Center: Nav Links (Desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="cursor-pointer px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right: Actions (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" asChild className="cursor-pointer">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="cursor-pointer">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Mobile: Theme Toggle + Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/50 px-4 pb-4 pt-2">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="cursor-pointer px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/50">
                  <Button variant="ghost" asChild className="cursor-pointer justify-start">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="cursor-pointer">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
