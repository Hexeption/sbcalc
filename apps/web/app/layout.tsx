import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

import "@workspace/ui/globals.css";
import "./fonts.css";
import { Toaster } from "@workspace/ui/components/sonner";
import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster />
        <GoogleAnalytics gaId="G-Y6TX20JW9F" />
        <GoogleTagManager gtmId="GT-MK5DGL8J" />
      </body>
    </html>
  );
}
