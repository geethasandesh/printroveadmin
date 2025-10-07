"use client";

import { useState, useCallback } from "react";
import {
  Page,
  LegacyCard,
  Text,
  Button,
  IndexTable,
  useIndexResourceState,
  Pagination,
  IndexFilters,
  useSetIndexFiltersMode,
  ChoiceList,
} from "@shopify/polaris";
import {
  DeleteIcon,
  ExportIcon,
  RefreshIcon,
  PlusIcon,
} from "@shopify/polaris-icons";

// Sample product data based on the screenshot
const products = [
  {
    id: "223761",
    sku: "215454642",
    name: "Butter Yellow 3XL Men Round",
    description: "A versatile storage cabinet with adjustable she...",
    onHand: 500,
    committed: 500,
    available: 500,
  },
  {
    id: "223761",
    sku: "215454642",
    name: "Butter Yellow 3XL Men Round",
    description: "A versatile storage cabinet with adjustable she...",
    onHand: 500,
    committed: 500,
    available: 500,
  },
  {
    id: "223761",
    sku: "215454642",
    name: "Butter Yellow 3XL Men Round",
    description: "A versatile storage cabinet with adjustable she...",
    onHand: 500,
    committed: 500,
    available: 500,
  },
  {
    id: "223761",
    sku: "215454642",
    name: "Butter Yellow 3XL Men Round",
    description: "A versatile storage cabinet with adjustable she...",
    onHand: 500,
    committed: 500,
    available: 500,
  },
  {
    id: "223761",
    sku: "215454642",
    name: "Butter Yellow 3XL Men Round",
    description: "A versatile storage cabinet with adjustable she...",
    onHand: 500,
    committed: 500,
    available: 500,
  },
  {
    id: "223761",
    sku: "215454642",
    name: "Butter Yellow 3XL Men Round",
    description: "A versatile storage cabinet with adjustable she...",
    onHand: 500,
    committed: 500,
    available: 500,
  },
  {
    id: "223761",
    sku: "215454642",
    name: "Butter Yellow 3XL Men Round",
    description: "A versatile storage cabinet with adjustable she...",
    onHand: 500,
    committed: 500,
    available: 500,
  },
  {
    id: "223761",
    sku: "215454642",
    name: "Butter Yellow 3XL Men Round",
    description: "A versatile storage cabinet with adjustable she...",
    onHand: 500,
    committed: 500,
    available: 500,
  },
];

export default function ProductList() {
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState(["date-desc"]);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCollection, setSelectedCollection] = useState<string[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<string[]>([]);

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products);

  const { mode, setMode } = useSetIndexFiltersMode();

  const handleSearchChange = useCallback(
    (value: string) => setSearchValue(value),
    []
  );

  const handleSortChange = useCallback(
    (value: string[]) => setSortValue(value),
    []
  );

  const handleCollectionChange = useCallback(
    (value: string[]) => setSelectedCollection(value),
    []
  );

  const handleProductTypeChange = useCallback(
    (value: string[]) => setSelectedProductType(value),
    []
  );

  const handleClearAll = useCallback(() => {
    handleSearchChange("");
    handleSortChange(["date-desc"]);
    handleCollectionChange([]);
    handleProductTypeChange([]);
  }, [
    handleSearchChange,
    handleSortChange,
    handleCollectionChange,
    handleProductTypeChange,
  ]);

  const filters = [
    {
      key: "collections",
      label: "Collections",
      filter: (
        <ChoiceList
          title="Collections"
          titleHidden
          choices={[
            { label: "T-Shirts", value: "tshirts" },
            { label: "Hoodies", value: "hoodies" },
            { label: "Accessories", value: "accessories" },
          ]}
          selected={selectedCollection}
          onChange={handleCollectionChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "productType",
      label: "Product",
      filter: (
        <ChoiceList
          title="Product Type"
          titleHidden
          choices={[
            { label: "Men", value: "men" },
            { label: "Women", value: "women" },
            { label: "Kids", value: "kids" },
          ]}
          selected={selectedProductType}
          onChange={handleProductTypeChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const sortOptions = [
    {
      label: "Date (newest)",
      value: "date desc",
      directionLabel: "Newest first",
    },
    {
      label: "Date (oldest)",
      value: "date asc",
      directionLabel: "Oldest first",
    },
    { label: "Product (A-Z)", value: "product asc", directionLabel: "A to Z" },
    { label: "Product (Z-A)", value: "product desc", directionLabel: "Z to A" },
  ];

  const rowMarkup = products.map(
    ({ id, sku, name, description, onHand, committed, available }, index) => (
      <IndexTable.Row
        id={id}
        key={id + index}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            <a
              href={`/products/${id}`}
              className="text-blue-600 hover:underline"
            >
              {id}
            </a>
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div className="flex items-start">
            <div className="w-10 h-10 bg-gray-200 rounded mr-3"></div>
            <div>
              <Text variant="bodyMd" fontWeight="bold" as="p">
                {name}
              </Text>
              <div className="text-gray-500">
                <Text variant="bodySm" as="p">
                  SKU: {sku}
                </Text>
              </div>
            </div>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="p">
            {description}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="p" alignment="center">
            {onHand}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="p" alignment="center">
            {committed}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="p" alignment="center">
            {available}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const promotedBulkActions = [
    {
      content: "Delete",
      icon: DeleteIcon,
      onAction: () => console.log("Delete action"),
    },
  ];

  const bulkActions = [
    {
      content: "Cancel",
      onAction: () => console.log("Cancel action"),
    },
  ];

  return (
    <Page title="All Products">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <div className="flex gap-2">
          <Button icon={PlusIcon}>Create</Button>
          <Button icon={ExportIcon}>Export Data</Button>
          <Button icon={RefreshIcon}>Sync</Button>
        </div>
      </div>

      <LegacyCard>
        <div className="p-5">
          <IndexFilters
            queryValue={searchValue}
            queryPlaceholder="Search your order here"
            onQueryChange={handleSearchChange}
            onQueryClear={() => setSearchValue("")}
            primaryAction={undefined}
            cancelAction={{
              onAction: handleClearAll,
              disabled: false,
            }}
            tabs={[]}
            filters={filters}
            appliedFilters={[]}
            onClearAll={handleClearAll}
            mode={mode}
            setMode={setMode}
            sortOptions={undefined}
            sortSelected={sortValue}
            onSort={handleSortChange}
            selected={0}
          />
        </div>

        <IndexTable
          resourceName={resourceName}
          itemCount={products.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Product ID" },
            { title: "Product" },
            { title: "Descriptions" },
            { title: "On hand", alignment: "center" },
            { title: "Committed", alignment: "center" },
            { title: "Available", alignment: "center" },
          ]}
          bulkActions={bulkActions}
          promotedBulkActions={promotedBulkActions}
        >
          {rowMarkup}
        </IndexTable>

        <div className="flex justify-between items-center p-4 border-t">
          <Text variant="bodyMd" as="p">
            Total Count: 20
          </Text>
          <div className="flex items-center gap-4">
            <div>
              <select
                className="border rounded p-2"
                value={itemsPerPage}
                onChange={(e) =>
                  setItemsPerPage(Number.parseInt(e.target.value))
                }
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            <Pagination
              hasPrevious
              onPrevious={() => {
                setCurrentPage(currentPage - 1);
              }}
              hasNext
              onNext={() => {
                setCurrentPage(currentPage + 1);
              }}
              label={`${currentPage} - 49`}
            />
          </div>
        </div>
      </LegacyCard>
    </Page>
  );
}
