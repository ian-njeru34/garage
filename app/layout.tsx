import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joe's Garage | Automotive Repair & Care",
  description: "Professional vehicle servicing, diagnostics, repairs, restoration and spare parts sourcing in Kenya.",
  applicationName: "Joe's Garage"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
