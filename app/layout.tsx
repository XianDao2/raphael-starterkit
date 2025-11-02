import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const baseUrl = process.env.BASE_URL
  ? `https://${process.env.BASE_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "QuickLearnChinese - Learn Chinese Quickly and Easily",
  description: "QuickLearnChinese helps you learn Chinese efficiently with AI-powered tools, personalized lessons, and interactive exercises.",
  keywords: "learn Chinese, Chinese learning, AI Chinese learning, Chinese lessons, study Chinese, Chinese language",
  openGraph: {
    title: "QuickLearnChinese - Learn Chinese Quickly and Easily",
    description: "QuickLearnChinese helps you learn Chinese efficiently with AI-powered tools, personalized lessons, and interactive exercises.",
    type: "website",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickLearnChinese - Learn Chinese Quickly and Easily",
    description: "QuickLearnChinese helps you learn Chinese efficiently with AI-powered tools.",
  },
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen">
            <Header user={user} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
