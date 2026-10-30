import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { CartProvider } from "@/context/CartContext";
import { LocationSelectorModal } from "@/components/location/LocationSelectorModal";
import { TrendingFoodPopup } from "@/components/notifications/TrendingFoodPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "BHUKKAD VERSE — Your Cravings. Your Universe.",
    template: "%s | BHUKKAD VERSE",
  },
  description:
    "Discover authentic neighborhood street food, royal luxury fine dining, and fresh daily kitchens. Hyperlocal online food delivery with real-time tracking, verified reviews, and instant checkout.",
  keywords: [
    "Bhukkad Verse",
    "online food delivery",
    "street food online",
    "luxury dining",
    "cloud kitchens",
    "local food delivery Delhi NCR",
    "fresh homestyle meals",
    "best food ordering app",
    "Ayush Saxena",
  ],
  authors: [{ name: "Ayush Saxena", url: "https://bhukkadverse.local" }],
  creator: "Ayush Saxena",
  publisher: "BHUKKAD VERSE",
  applicationName: "BHUKKAD VERSE",
  category: "Food & Drink",
  classification: "Food Delivery Marketplace",
  icons: {
    icon: [
      { url: "/brand/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/brand/favicon.png",
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "BHUKKAD VERSE — Your Cravings. Your Universe.",
    description:
      "Desi street food, royal Awadhi dum biryani, and fresh neighborhood kitchens cooked fresh and delivered to your doorstep.",
    url: "https://bhukkadverse.local",
    siteName: "BHUKKAD VERSE",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "BHUKKAD VERSE — Your Cravings. Your Universe.",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BHUKKAD VERSE — Your Cravings. Your Universe.",
    description: "Explore neighborhood eateries, royal dining, and street food carts delivered fresh.",
    creator: "@ayushsaxena",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://bhukkadverse.local/#website",
        "url": "https://bhukkadverse.local",
        "name": "BHUKKAD VERSE",
        "description": "Your Cravings. Your Universe. Multi-vendor food ordering & hyperlocal delivery.",
        "publisher": {
          "@id": "https://bhukkadverse.local/#organization",
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://bhukkadverse.local/shops?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://bhukkadverse.local/#organization",
        "name": "BHUKKAD VERSE",
        "url": "https://bhukkadverse.local",
        "logo": "https://bhukkadverse.local/brand/logo.png",
        "founder": {
          "@type": "Person",
          "name": "Ayush Saxena",
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91 9528055151",
          "contactType": "Customer Support",
          "areaServed": "IN",
          "availableLanguage": ["English", "Hindi"],
        },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-brand-cream text-brand-charcoal selection:bg-brand-orange selection:text-white">
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <Navbar />
              <LocationSelectorModal />
              <TrendingFoodPopup />
              <main className="flex-1">{children}</main>
              <Footer />
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
