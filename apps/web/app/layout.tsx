import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/app/providers";

const fontSans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Stallion — CRM for Outbound Sales Teams",
    template: "%s — Stallion",
  },
  description:
    "The modern CRM built for outbound sales teams. Manage contacts, automate sequences, and close more deals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
