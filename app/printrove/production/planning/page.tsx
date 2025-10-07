"use client";

import React, { useState, useEffect } from "react";
import { TextField, Select, Card, Button } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { usePlanningStore } from "@/store/usePlanningStore";
import { useBatchStore } from "@/store/useBatchStore";
import Link from "next/link";
import { BatchModal } from "@/app/components/BatchModal";

export default function PlanningPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { planningRecords, total, isLoading, fetchPlanningRecords } =
    usePlanningStore();
  const { createBatch } = useBatchStore();

  useEffect(() => {
    fetchPlanningRecords(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const handleCreateBatch = async (batchData: any) => {
    const success = await createBatch(batchData);
    if (success) {
      setIsModalOpen(false);
      // Refresh planning records
      fetchPlanningRecords(currentPage, itemsPerPage, searchQuery);
    }
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <b className="text-2xl font-extrabold">Production Planning</b>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Create Batch
        </Button>
      </div>

      <div className="flex justify-between items-center mt-4 mb-4">
        <Select
          label=""
          placeholder="Sort by date"
          value="date"
          options={[
            { label: "Sort by date", value: "date" },
            { label: "Newest First", value: "newest" },
            { label: "Oldest First", value: "oldest" },
          ]}
          onChange={() => {}}
        />
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search planning records"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
            autoComplete="off"
          />
        </div>
      </div>

      <Card>
        <GenericDataTable
          columnContentTypes={["text", "text", "text", "text", "text"]}
          headings={["Date", "UID", "Order ID", "Product Name", "Status"]}
          rows={planningRecords.map((record) => [
            formatDate(record.createdAt),
            record.uid,
            <Link
              href="#"
              className="text-[#005BD3] underline"
              key={record.orderId}
            >
              {record.orderId}
            </Link>,
            record.product.name,
            record.planningStatus,
          ])}
          pagination={{
            hasPrevious: currentPage > 1,
            hasNext: currentPage < Math.ceil(total / itemsPerPage),
            onPrevious: () => setCurrentPage(currentPage - 1),
            onNext: () => setCurrentPage(currentPage + 1),
            label: `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
              currentPage * itemsPerPage,
              total
            )} of ${total}`,
            totalCount: total,
          }}
        />
      </Card>

      {isLoading && <div>Loading...</div>}

      <BatchModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBatch}
      />
    </div>
  );
}
