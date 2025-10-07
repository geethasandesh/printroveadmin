"use client";
import { useState, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/components/Button";
import { usePrintConfig } from "@/store/usePrintConfigStore";
import { useRouter } from "next/navigation";

interface CreatePrintConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreatePrintConfigModal({
  open,
  onClose,
}: CreatePrintConfigModalProps) {
  const [name, setName] = useState("");
  const { createConfig, isLoading } = usePrintConfig();
  const router = useRouter();

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
    },
    []
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const result = await createConfig(name);
      setName("");
      onClose();
      // Navigate to the update page with the new config ID
      if (result?._id) {
        router.push(`/printrove/printconfig/update/${result._id}`);
      }
    } catch (error) {
      console.error("Failed to create config:", error);
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
                className="w-full transform overflow-hidden rounded-lg bg-white p-10 text-left align-middle shadow-xl transition-all"
                style={{ maxWidth: "160rem", width: "200%" }}
              >
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-semibold leading-6 text-gray-900"
                  >
                    Create Print Configuration
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
                        Enter the name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-base"
                        placeholder="Enter configuration name"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreate}
                    className="px-6 py-2"
                  >
                    {isLoading ? "Creating..." : "Create"}
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
