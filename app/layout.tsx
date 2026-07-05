import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../components/AuthProvider";
import "./globals.css";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TabIndicator from '../components/TabIndicator';


const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Douche • AI-Powered 3D E-Commerce",
  description: "Premium AI-powered e-commerce experience with personalized product recommendations and interactive 3D visualization.",
  metadataBase: new URL('http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} page-shell theme-shell antialiased`}>
        <AuthProvider>
          <Navbar />
          <TabIndicator />
          <main className="main-content">{children}</main>
          <Footer />

        </AuthProvider>
      </body>
    </html>
  );
}
