"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeactivationImpact {
  configName: string;
  currentStatus: string;
  hasActiveOrders: boolean;
  hasPendingOrders: boolean;
  canProceed: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  affectedProductsCount: number;
  affectedOrdersCount: number;
  affectedProducts: Array<{
    _id: string;
    title: string;
    productNumber: string;
    status: string;
  }>;
  warnings: string[];
  blockers: string[];
  recommendations: string[];
}

interface DeactivationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: 'soft' | 'force') => void;
  impact: DeactivationImpact | null;
  isLoading: boolean;
}

export default function DeactivationModal({
  open,
  onClose,
  onConfirm,
  impact,
  isLoading
}: DeactivationModalProps) {
  const [selectedMode, setSelectedMode] = useState<'soft' | 'force'>('soft');

  if (!impact) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                {/* Header */}
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                      Deactivate Print Configuration?
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-gray-500">
                      You are about to deactivate <strong>{impact.configName}</strong>
                    </p>
                  </div>
                </div>

                {/* Impact Summary */}
                <div className={`mt-6 p-4 border-2 rounded-lg ${getSeverityColor(impact.severity)}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⚠️</span>
                    <h4 className="text-lg font-semibold">Impact Assessment</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-3xl font-bold">{impact.affectedProductsCount}</div>
                      <div className="text-sm">Active Products</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{impact.affectedOrdersCount}</div>
                      <div className="text-sm">Affected Orders</div>
                    </div>
                  </div>

                  {(impact.hasActiveOrders || impact.hasPendingOrders) && (
                    <div className="mt-3 pt-3 border-t">
                      {impact.hasActiveOrders && (
                        <div className="flex items-center gap-2 text-red-700 mb-1">
                          <span className="font-semibold">🔴</span>
                          <span className="text-sm font-medium">Active orders in production</span>
                        </div>
                      )}
                      {impact.hasPendingOrders && (
                        <div className="flex items-center gap-2 text-yellow-700">
                          <span className="font-semibold">🟡</span>
                          <span className="text-sm font-medium">Pending orders awaiting production</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Warnings */}
                {impact.warnings.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Warnings:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {impact.warnings.map((warning, idx) => (
                        <li key={idx} className="text-sm text-yellow-800">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Blockers */}
                {impact.blockers.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-lg">
                    <h4 className="text-sm font-medium text-red-900 mb-2">🚫 Blockers:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {impact.blockers.map((blocker, idx) => (
                        <li key={idx} className="text-sm text-red-700">{blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {impact.recommendations.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {impact.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-blue-800">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Deactivation Mode Selection */}
                {impact.canProceed && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Choose Deactivation Mode:</h4>
                    
                    <label className={`relative flex cursor-pointer rounded-lg border p-4 ${
                      selectedMode === 'soft' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="deactivation-mode"
                        value="soft"
                        checked={selectedMode === 'soft'}
                        onChange={() => setSelectedMode('soft')}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer text-indigo-600 border-gray-300 focus:ring-indigo-600"
                      />
                      <span className="ml-3 flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          Soft Deactivate (Recommended)
                        </span>
                        <span className="block text-sm text-gray-500">
                          Hide configuration from new products. Existing products continue to work normally. Least disruptive option.
                        </span>
                      </span>
                    </label>

                    <label className={`relative flex cursor-pointer rounded-lg border p-4 ${
                      selectedMode === 'force' ? 'border-red-600 bg-red-50' : 'border-gray-300'
                    } ${impact.hasActiveOrders ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="deactivation-mode"
                        value="force"
                        checked={selectedMode === 'force'}
                        onChange={() => !impact.hasActiveOrders && setSelectedMode('force')}
                        disabled={impact.hasActiveOrders}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer text-red-600 border-gray-300 focus:ring-red-600 disabled:cursor-not-allowed"
                      />
                      <span className="ml-3 flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          Force Deactivate
                          {impact.hasActiveOrders && <span className="text-red-600 ml-2">(Blocked)</span>}
                        </span>
                        <span className="block text-sm text-gray-500">
                          Mark all associated products as invalid. Products will need alternative configurations. 
                          {impact.hasActiveOrders && ' Cannot proceed while orders are in production.'}
                        </span>
                      </span>
                    </label>
                  </div>
                )}

                {/* Notifications Info */}
                <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">📧 Team Notifications:</h4>
                  <p className="text-sm text-gray-600">
                    The following teams will be automatically notified:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      Admin Team
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                      Product Team
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                      Production Team
                    </span>
                    {selectedMode === 'force' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                        Quality Team
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-row-reverse gap-3">
                  {impact.canProceed ? (
                    <>
                      <button
                        type="button"
                        className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${
                          selectedMode === 'soft'
                            ? 'bg-indigo-600 hover:bg-indigo-500'
                            : 'bg-red-600 hover:bg-red-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={() => onConfirm(selectedMode)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : `Proceed with ${selectedMode === 'soft' ? 'Soft' : 'Force'} Deactivation`}
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        onClick={onClose}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

