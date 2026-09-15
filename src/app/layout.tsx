import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "WELL",
    template: "%s · WELL",
  },
  description:
    "Caderno de hábitos: alimentação com IA, movimento, diário e metas — estimativas, não dietas.",
  applicationName: "WELL",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WELL",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/brand/W.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/brand/icon_4.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#005F73",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-[var(--ink)]">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
