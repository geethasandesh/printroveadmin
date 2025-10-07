"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TextField, Select, Card, Badge } from "@shopify/polaris";
import {
  EditIcon,
  SearchIcon,
  SortAscendingIcon,
  SortDescendingIcon,
} from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { Button } from "@/app/components/Button";
import { IconButton } from "@/app/components/iconButton";
import { usePrintConfig } from "@/store/usePrintConfigStore";
import { format } from "date-fns";
import CreatePrintConfigModal from "./createPrintConfig";

export default function PrintConfigPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("ascending");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 10;

  const { configs, total, isLoading, fetchConfigs } = usePrintConfig();

  useEffect(() => {
    fetchConfigs(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSort = () => {
    setSortDirection(
      sortDirection === "ascending" ? "descending" : "ascending"
    );
  };

  const filtered = configs.filter((cfg) =>
    cfg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(
      sortDirection === "ascending" ? a.createdAt : b.createdAt
    );
    const dateB = new Date(
      sortDirection === "ascending" ? b.createdAt : a.createdAt
    );
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold">Print Configuration</h1>
        <Button
          variant="primary"
          size="lg"
          className="flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          + New
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search your configuration here"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
            autoComplete="off"
          />
        </div>
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
      </div>

      <Card>
        <GenericDataTable
          columnContentTypes={[
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
          ]}
          headings={[
            "S.NO",
            <div
              key="created-date"
              className="flex items-center gap-1 cursor-pointer"
              onClick={handleSort}
            >
              Created Date
              {sortDirection === "ascending" ? (
                <SortAscendingIcon className="w-4 h-4" />
              ) : (
                <SortDescendingIcon className="w-4 h-4" />
              )}
            </div>,
            "Name",
            "Status",
            "Products Listed",
            "Last Updated",
            "Actions",
          ]}
          rows={sorted.map((cfg, idx) => [
            (idx + 1).toString(),
            format(new Date(cfg.createdAt), "dd MMM yyyy"),
            cfg.name,
            <Badge
              key={cfg._id}
              tone={cfg.status === "active" ? "success" : "critical"}
            >
              {cfg.status.charAt(0).toUpperCase() + cfg.status.slice(1)}
            </Badge>,
            cfg.associatedProductIds.length.toString(),
            format(new Date(cfg.updatedAt), "dd MMM yyyy"),
            <IconButton
              key={cfg._id}
              icon={EditIcon}
              onClick={() =>
                router.push(`/printrove/printconfig/update/${cfg._id}`)
              }
              ariaLabel={`Edit ${cfg.name}`}
            />,
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

      <CreatePrintConfigModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
