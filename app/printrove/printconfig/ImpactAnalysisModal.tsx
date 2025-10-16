"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AffectedProduct {
  _id: string;
  title: string;
  productNumber: string;
  status: string;
  affectedPositions: string[];
  printConfigName: string;
  thumbnails?: Array<{ url: string }>;
}

interface ConfigChangeImpact {
  canProceed: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  affectedProductsCount: number;
  affectedOrdersCount: number;
  affectedProducts: AffectedProduct[];
  removedPositions: string[];
  warnings: string[];
  blockers: string[];
  recommendations: string[];
}

interface ImpactAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  impact: ConfigChangeImpact | null;
  configName: string;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'text-red-700 bg-red-50 border-red-300';
    case 'high':
      return 'text-orange-700 bg-orange-50 border-orange-300';
    case 'medium':
      return 'text-yellow-700 bg-yellow-50 border-yellow-300';
    case 'low':
      return 'text-blue-700 bg-blue-50 border-blue-300';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-300';
  }
};

const getSeverityIcon = (severity: string) => {
  if (severity === 'critical' || severity === 'high') {
    return '🚫';
  } else if (severity === 'medium') {
    return '⚠️';
  } else {
    return 'ℹ️';
  }
};

export default function ImpactAnalysisModal({
  open,
  onClose,
  onConfirm,
  impact,
  configName
}: ImpactAnalysisModalProps) {
  if (!impact) return null;

  const severityColor = getSeverityColor(impact.severity);
  const severityIcon = getSeverityIcon(impact.severity);

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
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
                  <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${severityColor} sm:mx-0 sm:h-10 sm:w-10`}>
                    <span className="text-2xl">{severityIcon}</span>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                      Configuration Change Impact
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-gray-500">
                      Analyzing changes to <strong>{configName}</strong> print configuration
                    </p>
                  </div>
                </div>

                {/* Impact Summary */}
                <div className={`mt-6 p-4 border rounded-lg ${severityColor}`}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{impact.affectedProductsCount}</div>
                      <div className="text-sm">Affected Products</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{impact.removedPositions.length}</div>
                      <div className="text-sm">Positions Removed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold uppercase">{impact.severity}</div>
                      <div className="text-sm">Severity Level</div>
                    </div>
                  </div>
                </div>

                {/* Removed Positions */}
                {impact.removedPositions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Positions Being Removed:</h4>
                    <div className="flex flex-wrap gap-2">
                      {impact.removedPositions.map((position, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                        >
                          {position}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {impact.warnings.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">⚠️ Warnings:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {impact.warnings.map((warning, idx) => (
                        <li key={idx} className="text-sm text-yellow-700">{warning}</li>
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
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {impact.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Affected Products Table */}
                {impact.affectedProducts.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Affected Products ({impact.affectedProductsCount}):</h4>
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Affected Positions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {impact.affectedProducts.map((product) => (
                            <tr key={product._id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm">
                                <div className="flex items-center gap-2">
                                  {product.thumbnails?.[0]?.url && (
                                    <img
                                      src={product.thumbnails[0].url}
                                      alt={product.title}
                                      className="h-8 w-8 rounded object-cover"
                                    />
                                  )}
                                  <span className="font-medium text-gray-900">{product.title}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500">{product.productNumber}</td>
                              <td className="px-3 py-2 text-sm">
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {product.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500">
                                {product.affectedPositions.join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 sm:flex sm:flex-row-reverse gap-3">
                  {impact.canProceed ? (
                    <>
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
                        onClick={onConfirm}
                      >
                        {impact.affectedProductsCount > 0 ? 'Force Update Anyway' : 'Proceed'}
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 sm:w-auto"
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

