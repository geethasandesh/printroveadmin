"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TextField, Select, Card, Badge } from "@shopify/polaris";
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
import { useCollectionStore } from "@/store/useCollectionStore";
import { format } from "date-fns";
import CreateCollectionModal from "./createCollection";

export default function CollectionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("ascending");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 10;

  const { collections, total, isLoading, fetchCollections, deleteCollection } =
    useCollectionStore();

  useEffect(() => {
    fetchCollections(currentPage, itemsPerPage);
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
    if (window.confirm("Are you sure you want to delete this collection?")) {
      try {
        await deleteCollection(id);
      } catch (error) {
        console.error("Failed to delete collection:", error);
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/printrove/collections/update/${id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const filtered = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-4xl font-extrabold">Collections</h1>
        <Button
          variant="primary"
          size="lg"
          className="flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          + New Collection
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search collections"
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
            "Type",
            "Products Listed",
            "Actions",
          ]}
          rows={sorted.map((collection, idx) => [
            (idx + 1).toString(),
            format(new Date(collection.createdAt), "dd MMM yyyy"),
            collection.name,
            <Badge
              key={collection._id}
              tone={collection.type === "LISTED" ? "success" : "critical"}
            >
              {collection.type === "LISTED" ? "Listed" : "Unlisted"}
            </Badge>,
            collection.productCount ?? 0,
            <div key={collection._id} className="flex gap-2">
              <IconButton
                icon={EditIcon}
                onClick={() => handleEdit(collection._id)}
                ariaLabel={`Edit ${collection.name}`}
              />
              <IconButton
                icon={DeleteIcon}
                onClick={() => handleDelete(collection._id)}
                ariaLabel={`Delete ${collection.name}`}
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

      <CreateCollectionModal open={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
