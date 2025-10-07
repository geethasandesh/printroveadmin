"use client";

import React, { useState, useEffect } from "react";
import { Card, Icon, Toast, ButtonGroup } from "@shopify/polaris";
import { DeleteIcon, ViewIcon, PrintIcon } from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { usePickingStore } from "@/store/usePickingStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/app/components/ConfirmModal";

export default function PickingPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState({
    message: "",
    error: false,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pickingToDelete, setPickingToDelete] = useState<string | null>(null);
  const itemsPerPage = 10;

  const { pickings, total, isLoading, fetchPickings, deletePicking } =
    usePickingStore();

  useEffect(() => {
    fetchPickings(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, fetchPickings]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const showToast = (message: string, error: boolean = false) => {
    setToastContent({ message, error });
    setToastActive(true);
    setTimeout(() => setToastActive(false), 5000);
  };

  const handleView = (pickingId: string) => {
    router.push(`/printrove/production/picking/${pickingId}`);
  };

  const handlePrint = (pickingId: string) => {
    console.log("Printing picking", pickingId);
    // Implement print functionality
  };

  const openDeleteModal = (pickingId: string) => {
    setPickingToDelete(pickingId);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!pickingToDelete) return;

    try {
      const result = await deletePicking(pickingToDelete);

      setDeleteModalOpen(false);
      setPickingToDelete(null);

      if (result.success) {
        showToast("Picking record deleted successfully", false);
      } else {
        showToast(result.message || "Failed to delete picking record", true);
      }
    } catch (error: any) {
      showToast(
        error.message || "An error occurred while deleting the picking record",
        true
      );
    }
  };

  // Extract batch number from the batch name (format: batchNumber-fromDate-toDate)
  const extractBatchNumber = (batchName: string) => {
    const parts = batchName.split("-");
    return parts[0] || batchName;
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <b className="text-2xl font-extrabold">Picking Records</b>
      </div>

      {/* Removed the search and sorting controls */}

      <Card>
        <GenericDataTable
          columnContentTypes={[
            "text", // Batch Number
            "text", // Date
            "text", // Batch Name
            "numeric", // To Pick
            "text", // Actions
          ]}
          headings={[
            "Batch Number",
            "Date",
            "Batch Name",
            "To Pick",
            "Actions",
          ]}
          rows={pickings.map((picking) => [
            // Batch Number (extracted from batchName)
            extractBatchNumber(picking.batchName),

            // Date
            formatDate(picking.date),

            // Batch Name (clickable)
            <Link
              href="#"
              className="text-[#005BD3] underline"
              key={picking._id}
              onClick={(e) => {
                e.preventDefault();
                handleView(picking._id);
              }}
            >
              {picking.batchName}
            </Link>,

            // To Pick (quantity)
            picking.toPick,

            // Actions
            <div
              className="flex items-center space-x-3"
              key={`actions-${picking._id}`}
            >
              <ButtonGroup>
                <button
                  onClick={() => handleView(picking._id)}
                  className="p-1.5 rounded hover:bg-gray-100"
                  title="View"
                >
                  <Icon source={ViewIcon} />
                </button>
                <button
                  onClick={() => handlePrint(picking._id)}
                  className="p-1.5 rounded hover:bg-gray-100"
                  title="Print"
                >
                  <Icon source={PrintIcon} />
                </button>
                <button
                  onClick={() => openDeleteModal(picking._id)}
                  className="p-1.5 rounded hover:bg-gray-100 text-red-500"
                  title="Delete"
                >
                  <Icon source={DeleteIcon} />
                </button>
              </ButtonGroup>
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

      {isLoading && (
        <div className="flex justify-center items-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {toastActive && (
        <Toast
          content={toastContent.message}
          error={toastContent.error}
          onDismiss={() => setToastActive(false)}
        />
      )}

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Picking Record"
        message="Are you sure you want to delete this picking record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive={true}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPickingToDelete(null);
        }}
      />
    </div>
  );
}
