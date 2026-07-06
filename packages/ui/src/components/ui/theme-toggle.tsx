"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "./button";

export function getNextTheme(resolvedTheme: string | undefined) {
  return resolvedTheme === "dark" ? "light" : "dark";
}

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = getNextTheme(resolvedTheme);
  const label = `Switch to ${nextTheme} mode`;

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      className="relative cursor-pointer"
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
      <span className={showLabel ? "ml-1" : "sr-only"}>
        {resolvedTheme === "dark" ? "Dark" : "Light"}
      </span>
    </Button>
  );
}
