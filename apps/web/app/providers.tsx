"use client";
import * as React from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { Toaster } from "sileo";
import { isHandledAppError } from "@/lib/error";
import { useError } from "@/hooks/useError";
import { useErrorStore } from "@/store/error.store";

function ErrorProvider({ children }: { children: React.ReactNode }) {
  useError();
  return <>{children}</>;
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Toaster
      position="top-center"
      options={{
        // Light: soft lavender matching --secondary/--accent (oklch 0.962 0.018 272)
        // Dark:  deep purple matching the app's dark card palette
        fill: isDark ? "#1e1535" : "#ede8f8",
        duration: 5000,
        roundness: 16,
        styles: {
          // Let sileo render state-colour titles (green ✓, red ✗, etc.)
          // Description text: white on dark-purple, muted-dark on light-purple
          description: isDark ? "text-white/75!" : "text-foreground/70!",
        },
      }}
      theme="system"
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { setError } = useErrorStore();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes
            gcTime: 15 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
          mutations: {
            retry: 1,
            onError: (error: unknown) => {
              if (isHandledAppError(error)) {
                setError(error);
              }
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
          <ThemedToaster />
        </NextThemesProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ErrorProvider>
    </QueryClientProvider>
  );
}
