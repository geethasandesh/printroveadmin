import { Suspense } from "react";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <main className="min-h-screen bg-[#F5F5F5]">{children}</main>
    </Suspense>
  );
}
