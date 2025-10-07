"use client";

import type React from "react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import { Frame } from "@shopify/polaris";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppProvider i18n={en}>
      <Frame navigation={<Sidebar />} topBar={<Navbar />}>
        {children}
      </Frame>
    </AppProvider>
  );
}
