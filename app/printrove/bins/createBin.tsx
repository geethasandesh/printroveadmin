"use client";
import { useState, useCallback, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/components/Button";
import { useBinStore } from "@/store/useBinStore";

interface CreateBinModalProps {
  open: boolean;
  onClose: () => void;
  editData?: { _id: string; name: string; category: string } | null;
}

export default function CreateBinModal({
  open,
  onClose,
  editData = null,
}: CreateBinModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Blanks", // Default value
    capacity: 1000, // Default capacity (same size for all bins)
  });

  const { createBin, updateBin, isLoading } = useBinStore();

  // Update form data when editing an existing bin
  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        category: editData.category,
        capacity: (editData as any).capacity || 1000,
      });
    } else {
      // Reset form when creating a new bin
      setFormData({
        name: "",
        category: "Blanks",
        capacity: 1000,
      });
    }
  }, [editData]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'capacity' ? Number(value) : value,
      }));
    },
    []
  );

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.category) return;

    try {
      // Log what we're sending
      console.log("Submitting bin data:", formData);
      
      if (editData) {
        // Update existing bin
        await updateBin(editData._id, formData);
      } else {
        // Create new bin
        await createBin(formData);
      }

      // Reset form and close modal
      setFormData({ name: "", category: "Blanks", capacity: 1000 });
      onClose();
    } catch (error: any) {
      console.error(`Failed to ${editData ? "update" : "create"} bin:`, error);
      // Show error to user
      const errorMessage = error.response?.data?.message || error.message || "Failed to create bin";
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <Transition.Root show={open} as="div">
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all"
                style={{ maxWidth: "160rem", width: "200%" }}
              >
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-semibold leading-6 text-gray-900"
                  >
                    {editData ? "Edit Bin" : "Create New Bin"}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Bin Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-base"
                        placeholder="Enter bin name"
                        autoComplete="off"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-base"
                      >
                        <option value="Blanks">Blanks</option>
                        <option value="Printed">Printed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Capacity (Max Items)
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        min="1"
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-base"
                        placeholder="Enter bin capacity"
                        autoComplete="off"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Maximum number of items this bin can hold (default: 1000)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isLoading || !formData.name.trim()}
                    className="px-6 py-2"
                  >
                    {isLoading
                      ? editData
                        ? "Updating..."
                        : "Creating..."
                      : editData
                      ? "Update"
                      : "Create"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
