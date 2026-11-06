import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"; // <-- added
import { Providers } from "@/components/providers";
import "./globals.css";

// latin-ext + vietnamese subsets contain the dotted/underdotted letters used in Igbo and Yorùbá (ị ọ ụ ẹ ṣ ṅ)
const inter = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "CKTV   Christian Kingdom Trend Vision",
    template: "%s | CKTV",
  },
  openGraph: { siteName: "CKTV", type: "website" },
  description:
    "Stories that inspire. Faith that moves. Welcome to CKTV, your home for honest conversations, powerful teaching, and a community growing in faith together.",
  // generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === "production" && <Analytics />}

        {/* Smartsupp Live Chat */}
       <Script id="smartsupp-chat" strategy="afterInteractive">
  {`
    var _smartsupp = _smartsupp || {};
    _smartsupp.key = 'cb6b1b29a82dddf8270861ebbfccd4ea0ec8273b';
    window.smartsupp||(function(d) {
      var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
      s=d.getElementsByTagName('script')[0];c=d.createElement('script');
      c.type='text/javascript';c.charset='utf-8';c.async=true;
      c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
    })(document);
  `}

        </Script>
      </body>
    </html>
  );
}


