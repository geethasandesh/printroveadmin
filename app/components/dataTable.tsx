import React, { useEffect } from "react";
import { DataTable, Pagination } from "@shopify/polaris";

interface GenericDataTableProps {
  headings: React.ReactNode[];
  rows: (React.ReactNode | string)[][];
  columnContentTypes: ("text" | "numeric")[];
  pagination?: {
    hasNext: boolean;
    hasPrevious: boolean;
    onNext: () => void;
    onPrevious: () => void;
    label: string;
    totalCount: number; // Add this new prop
  };
  onSortClick?: () => void;
  sortDirection?: "ascending" | "descending";
  headerBgColor?: string;
  onRowClick?: (row: any[], rowIndex: number) => void;
}

const GenericDataTable: React.FC<GenericDataTableProps> = ({
  headings,
  rows,
  columnContentTypes,
  pagination,
  onSortClick,
  sortDirection,
  headerBgColor = "#F7F7F7",
  onRowClick,
}) => {
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      .generic-data-table thead {
        background-color: ${headerBgColor} !important;
      }
      .generic-data-table thead th {
        text-align: left !important;
      }
      .generic-data-table tbody td {
        text-align: left !important;
      }
      .generic-data-table tfoot tr {
        background-color: ${headerBgColor} !important;
      }
      .generic-data-table tfoot td {
        text-align: left !important;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, [headerBgColor]);

  const enhancedHeadings = headings.map((heading, i) => {
    if (onSortClick && heading === "Orders") {
      return (
        <button
          onClick={onSortClick}
          key={i + String(heading)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            fontWeight: "bold",
          }}
          aria-sort={sortDirection ? sortDirection : "none"}
        >
          {heading}
        </button>
      );
    }
    return heading;
  });

  const tableRows = rows.map((row, rowIndex) => ({
    cells: row,
    onClick: onRowClick ? () => onRowClick(row, rowIndex) : undefined,
  }));

  return (
    <div className="generic-data-table">
      <DataTable
        columnContentTypes={columnContentTypes}
        headings={enhancedHeadings}
        rows={rows}
      />
      {pagination && (
        <div
          style={{ backgroundColor: headerBgColor }}
          className="flex justify-between items-center px-4 py-2"
        >
          <div className="text-sm text-gray-600">
            Total Count: {pagination.totalCount}
          </div>
          <div className="flex items-center gap-4">
            <Pagination
              hasPrevious={pagination.hasPrevious}
              onPrevious={pagination.onPrevious}
              hasNext={pagination.hasNext}
              onNext={pagination.onNext}
              accessibilityLabel={pagination.label}
              label={pagination.label}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericDataTable;
