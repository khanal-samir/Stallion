"use client";
import * as React from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sileo";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "@workspace/validators";
import { useError } from "@/hooks/useError";
import { useErrorStore } from "@/store/error.store";

function ErrorProvider({ children }: { children: React.ReactNode }) {
  useError();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { setError } = useErrorStore();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,
            gcTime: 15 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
          mutations: {
            retry: 1,
            onError: (error: Error) => {
              if ("isAxiosError" in error && error.isAxiosError) {
                setError(error as AxiosError<ApiErrorResponse>);
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
          <Toaster
            position="top-center"
            options={{
              fill: "#171717",
              styles: { description: "text-white/75!" },
            }}
            theme="system"
          />
        </NextThemesProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ErrorProvider>
    </QueryClientProvider>
  );
}
