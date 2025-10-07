"use client";
import React, { useState, useEffect } from "react";
import { TextField, Select, Card } from "@shopify/polaris";
import {
  EditIcon,
  SearchIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { Button } from "@/app/components/Button";
import { IconButton } from "@/app/components/iconButton";
import { useBinStore } from "@/store/useBinStore";
import { format } from "date-fns";
import CreateBinModal from "./createBin";

export default function BinsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("ascending");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<{
    _id: string;
    name: string;
    category: string;
  } | null>(null);
  const itemsPerPage = 10;

  const { bins, total, isLoading, fetchBins, deleteBin } = useBinStore();

  useEffect(() => {
    fetchBins(currentPage, itemsPerPage);
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this bin?")) {
      try {
        await deleteBin(id);
      } catch (error) {
        console.error("Failed to delete bin:", error);
      }
    }
  };

  const handleEdit = (bin: { _id: string; name: string; category: string }) => {
    setEditingBin(bin);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBin(null); // Clear editing bin data when modal is closed
  };

  const filtered = bins.filter((bin) =>
    bin.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-4xl font-extrabold">Bins Management</h1>
        <Button
          variant="primary"
          size="lg"
          className="flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          + New Bin
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search bins"
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
          columnContentTypes={["text", "text", "text", "text", "text", "text"]}
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
            "Category",
            "Last Updated",
            "Actions",
          ]}
          rows={sorted.map((bin, idx) => [
            (idx + 1).toString(),
            format(new Date(bin.createdAt), "dd MMM yyyy"),
            bin.name,
            bin.category,
            format(new Date(bin.updatedAt), "dd MMM yyyy"),
            <div key={bin._id} className="flex gap-2">
              <IconButton
                icon={EditIcon}
                onClick={() => handleEdit(bin)}
                ariaLabel={`Edit ${bin.name}`}
              />
              <IconButton
                icon={DeleteIcon}
                onClick={() => handleDelete(bin._id)}
                ariaLabel={`Delete ${bin.name}`}
              />
            </div>,
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

      <CreateBinModal
        open={isModalOpen}
        onClose={handleCloseModal}
        editData={editingBin}
      />
    </div>
  );
}
