import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:{default:"Radar — Opportunities find you",template:"%s | Radar"},description:"Discover opportunities worth your attention.",metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000")};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip" href="#content">Skip to content</a>{children}</body></html>;}
