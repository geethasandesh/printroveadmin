"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Card, Select, Text } from "@shopify/polaris";
import { useProductStore } from "@/store/useProductStore";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDesignEditPage({ params }: PageProps) {
  const { id } = use(params);
  const { getProduct, currentProduct, isLoadingProduct } = useProductStore();

  const [selectedCombo, setSelectedCombo] = useState<string>("");
  const [selectedPrintConfig, setSelectedPrintConfig] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  useEffect(() => {
    if (id) getProduct(id);
  }, [id, getProduct]);

  // Build combinations list from variantConfigurations keys
  const combinationOptions = useMemo(() => {
    const keys = Object.keys((currentProduct as any)?.variantConfigurations || {});
    return [{ label: "Select variant", value: "" }, ...keys.map((k) => ({ label: k, value: k }))];
  }, [currentProduct]);

  // When product loads, default to first combination
  useEffect(() => {
    const first = combinationOptions.find((o) => o.value);
    if (first && !selectedCombo) setSelectedCombo(first.value);
  }, [combinationOptions, selectedCombo]);

  const currentVariant = useMemo(() => {
    if (!currentProduct || !selectedCombo) return null as any;
    const cfgs = (currentProduct as any).variantConfigurations || {};
    return cfgs[selectedCombo] || null;
  }, [currentProduct, selectedCombo]);

  // Build print config options from selected variant
  const printConfigOptions = useMemo(() => {
    const list = currentVariant?.printConfigurations || [];
    return [{ label: "Select print type", value: "" }, ...list.map((pc: any) => ({ label: pc.name, value: pc.name }))];
  }, [currentVariant]);

  // Default print config
  useEffect(() => {
    const first = printConfigOptions.find((o) => o.value);
    if (first && !selectedPrintConfig) setSelectedPrintConfig(first.value);
  }, [printConfigOptions, selectedPrintConfig]);

  const locationsForSelected = useMemo(() => {
    const pcs: any[] = currentVariant?.printConfigurations || [];
    const pc = pcs.find((p) => p.name === selectedPrintConfig);
    const locs = pc?.locations || [];
    return [{ label: "Select position", value: "" }, ...locs.map((l: any) => ({ label: l.location, value: l.location }))];
  }, [currentVariant, selectedPrintConfig]);

  // Default location
  useEffect(() => {
    const first = locationsForSelected.find((o) => o.value);
    if (first && !selectedLocation) setSelectedLocation(first.value);
  }, [locationsForSelected, selectedLocation]);

  const gridlineUrl = useMemo(() => {
    const pcs: any[] = currentVariant?.printConfigurations || [];
    const pc = pcs.find((p) => p.name === selectedPrintConfig);
    const loc = (pc?.locations || []).find((l: any) => l.location === selectedLocation);
    const first = loc?.gridlines?.[0];
    return first?.signedUrl || first?.url || "";
  }, [currentVariant, selectedPrintConfig, selectedLocation]);

  if (isLoadingProduct || !currentProduct) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 bg-[#F5F5F5]">
      <div className="max-w-[1200px] mx-auto grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <Card>
            <div className="p-4 space-y-4">
              <Text as="h2" variant="headingLg">Design Setup</Text>
              <Select label="Variant" options={combinationOptions} value={selectedCombo} onChange={setSelectedCombo} />
              <Select label="Print Type" options={printConfigOptions} value={selectedPrintConfig} onChange={setSelectedPrintConfig} />
              <Select label="Position" options={locationsForSelected} value={selectedLocation} onChange={setSelectedLocation} />
            </div>
          </Card>
        </div>

        <div className="col-span-2">
          <Card>
            <div className="p-4 flex items-center justify-center bg-white min-h-[600px]">
              {gridlineUrl ? (
                <img src={gridlineUrl} alt="Gridline" className="max-w-full max-h-[560px] object-contain" />
              ) : (
                <div className="text-gray-500">No gridline image for the selected position.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


