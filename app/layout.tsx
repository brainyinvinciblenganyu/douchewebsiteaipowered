import type { Metadata } from "next";
import { BackendAuthProvider as AuthProvider } from "../components/BackendAuthProvider";
import "./globals.css";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TabIndicator from '../components/TabIndicator';

const fontVariables = {
  '--font-sans': 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  '--font-mono': '"SFMono-Regular", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
};

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
      <body className="page-shell theme-shell antialiased" style={fontVariables}>
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
