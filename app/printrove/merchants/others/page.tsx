"use client";

import React, { useState, useEffect } from "react";
import { Card, Select, TextField, Text, Tabs, Badge } from "@shopify/polaris";
import { Switch, Checkbox } from "@headlessui/react";
import { Button } from "@/app/components/Button";
import { PrintIcon } from "@shopify/polaris-icons";
import { IconButton } from "@/app/components/iconButton";
import GenericDataTable from "@/app/components/dataTable";
import { useSearchParams } from "next/navigation";
import { ArrowDiagonalIcon } from "@shopify/polaris-icons";
import photo from "../../../../public/sample-product.jpg";
import { useMerchantsStore } from "@/store/useMerchantsStore";

export default function MerchantDetails() {
  const searchParams = useSearchParams();
  const idData: any = searchParams.get("id");

  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTranTab, setSelectedTranTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [apiData, setApiData] = useState<any>({});
  const itemsPerPage = 10;

  const { merchantDetails, total, isLoading, fetchMerchantsById } =
    useMerchantsStore();

  useEffect(() => {
    fetchMerchantsById(idData);
  }, [idData]);

  // useEffect(() => {
  //     if(selectedTab === 2) {
  //         toggleOptions.reduce((acc, key) => {
  //             acc[key] = false;
  //             return acc;
  //         }, {} as Record<string, boolean>)
  //     }
  // }, [selectedTab]);

  const bills = [
    {
      batchId: "123456",
      date: "2023-10-01",
      batchName: "REF123",
      toPick: "Vendor A",
      actions: "Pending",
    },
    {
      batchId: "654321",
      date: "2023-10-02",
      batchName: "REF456",
      toPick: "Vendor B",
      actions: "Completed",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const tabs = [
    { id: "information", content: "Information" },
    { id: "customBranding", content: "Custom Branding" },
    { id: "settings", content: "Settings" },
    { id: "transactions", content: "Transactions" },
  ];

  const tranTabs = [
    { id: "credit", content: "Credit" },
    { id: "payment", content: "Payment" },
    { id: "remittance", content: "Remittance" },
    { id: "invoice", content: "Invoice" },
  ];

  const toggleOptions = [
    "Inner Necklable",
    "Outer Necklable",
    "Hangtags",
    "Pack-ins",
    "Stickers",
    "Polybags",
  ];

  const [toggles, setToggles] = useState(
    toggleOptions.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleToggle = (key: string) => {
    setToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const chunkedToggles: any = [];
  for (let i = 0; i < toggleOptions.length; i += 3) {
    chunkedToggles.push(toggleOptions.slice(i, i + 3));
  }

  const checkboxOptions = [
    "Business",
    "Auto Rush",
    "Generate shipping labels",
    "Allow Mark as Rush",
    "Bank Verified",
    "Date",
  ];
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    checkboxOptions.reduce((acc: any, key: any) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleChange = (key: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Chunk the options into rows of 3
  const chunkedOptions: any = [];
  for (let i = 0; i < checkboxOptions.length; i += 3) {
    chunkedOptions.push(checkboxOptions.slice(i, i + 3));
  }

  const [postPaid, setPostPaid] = useState(false);

  const handlePostPaid = () => {
    setPostPaid(!postPaid);
  };

  const [creditData, setCredtData] = useState();

  const handleInputChange = (e: any) => {
    setCredtData(e);
  };

  const handleSave = () => {
    switch (selectedTab) {
      case 0:
        handleSaveInformation();
        break;
      case 1:
        handleSaveBranding();
        break;
      case 2:
        handleSaveSettings();
        break;
      case 3:
        handleSaveTransactions();
        break;
      default:
        console.warn("Unknown tab selected");
    }
  };

  const handleSaveInformation = () => {
    alert("Information");
  };

  const handleSaveBranding = () => {
    alert("Custom Branding");
    console.log(toggles);
  };

  const handleSaveSettings = () => {
    alert("Save Settings");
    console.log(checkedItems);
  };

  const handleSaveTransactions = () => {
    alert("Save Transactions");
  };

  const informationTab = () => (
    <div className="p-5 space-y-8">
      {/* Primary Contact Section */}
      <div>
        <div className="mb-4">
          <Text variant="headingMd" as="h3">
            Primary Contact
          </Text>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Text as="p" variant="bodyLg">
                First Name
              </Text>
              <Text as="p" variant="bodyLg">
                {merchantDetails?.data?.profile?.full_name}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                Vendor Phone Number
              </Text>
              <Text as="p" variant="bodyLg">
                {merchantDetails?.data?.profile?.phone_number}
              </Text>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Text as="p" variant="bodyMd">
                Last Name
              </Text>
              <Text as="p" variant="bodyLg">
                {merchantDetails?.data?.profile?.last_name}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                Vendor Email
              </Text>
              <Text as="p" variant="bodyLg">
                {merchantDetails?.data?.profile?.email}
              </Text>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Text as="p" variant="bodyMd">
                Address
              </Text>
              <Text as="p" variant="bodyLg">
                {
                  merchantDetails?.data?.business_and_banking_info
                    ?.address_line1
                }
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                ZOHO CRM ID
              </Text>
              <Text as="p" variant="bodyLg">
                {"-"}
              </Text>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-4">
          <Text variant="headingMd" as="h3">
            Account
          </Text>
        </div>
        <Card>
          <b>Available balance</b>
          <p>Rs 1000/-</p>
        </Card>
      </div>

      <div>
        <div className="mb-4">
          <Text variant="headingMd" as="h3">
            Buissness Details
          </Text>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Text as="p" variant="bodyMd">
                Company Name
              </Text>
              <Text as="p" variant="bodyLg">
                {merchantDetails?.data?.business_and_banking_info?.company_name}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                GST Number
              </Text>
              <Text as="p" variant="bodyLg">
                {merchantDetails?.data?.business_and_banking_info?.gstin}
              </Text>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Text as="p" variant="bodyMd">
                Brand Name
              </Text>
              <Text as="p" variant="bodyLg">
                {merchantDetails?.data?.business_and_banking_info?.store_name}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                Business Address
              </Text>
              <Text as="p" variant="bodyLg">
                {
                  merchantDetails?.data?.business_and_banking_info
                    ?.address_line2
                }
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <Text variant="headingMd" as="h3">
            GST Web Search
          </Text>
        </div>
        <Card>
          <b>Company GST Profile</b>
          <div className="flex justify-between items-center">
            <p className="mt-10">
              {merchantDetails?.data?.business_and_banking_info?.gstin}
            </p>
            <IconButton
              icon={ArrowDiagonalIcon}
              onClick={() => alert("Link")}
              className="cursor-pointer"
            />
          </div>
        </Card>
      </div>

      <div>
        <div className="mb-4">
          <Text variant="headingMd" as="h3">
            Store Settings
          </Text>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Text as="p" variant="bodyMd">
                Store URL
              </Text>
              <Text as="p" variant="bodyLg">
                hello{" "}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                Auto Pull
              </Text>
              <Text as="p" variant="bodyLg">
                <Badge tone={"success"}>Enabled</Badge>
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                Update on dispatch
              </Text>
              <Text as="p" variant="bodyLg">
                <Badge tone={"success"}>Enabled</Badge>
              </Text>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Text as="p" variant="bodyMd">
                Platform
              </Text>
              <Text as="p" variant="bodyLg">
                hello{" "}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                Auto place pre-paid
              </Text>
              <Text as="p" variant="bodyLg">
                <Badge tone={"critical"}>Disabled</Badge>
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                Store stock sync
              </Text>
              <Text as="p" variant="bodyLg">
                <Badge tone={"critical"}>Disabled</Badge>
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <Text variant="headingMd" as="h3">
            Bank Information
          </Text>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Text as="p" variant="bodyMd">
                Account Holder Name
              </Text>
              <Text as="p" variant="bodyLg">
                {
                  merchantDetails?.data?.business_and_banking_info
                    ?.bank_holder_name
                }
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                Bank Name
              </Text>
              <Text as="p" variant="bodyLg">
                {merchantDetails?.data?.business_and_banking_info?.company_name}
              </Text>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Text as="p" variant="bodyMd">
                Account Number
              </Text>
              <Text as="p" variant="bodyLg">
                {
                  merchantDetails?.data?.business_and_banking_info
                    ?.account_number
                }
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                IFSC
              </Text>
              <Text as="p" variant="bodyLg">
                {merchantDetails?.data?.business_and_banking_info?.ifsc_code}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getImageForLabel = (label: string): string => {
    const imageMap: Record<string, string> = {
      "Inner Necklable": photo.src,
      "Outer Necklable": photo.src,
      Hangtags: photo.src,
      "Pack-ins": photo.src,
      Stickers: photo.src,
      Polybags: photo.src,
    };

    return imageMap[label] || "/images/placeholder.jpg";
  };

  const customBrandingTab = () => (
    <div className="p-5 space-y-8">
      <div>
        <div className="mb-4">
          <Text variant="headingMd" as="h3">
            Custom Branding Information
          </Text>
        </div>

        {/* <div className="space-y-4">
                    {chunkedToggles.map((group: any, rowIndex: any) => (
                        <div key={rowIndex} className="flex justify-between gap-4">
                            {group.map((label: any, index: any) => (
                                <div key={index} className="flex items-center space-x-2 w-full">
                                    <Switch
                                        checked={toggles[label]}
                                        onChange={() => handleToggle(label)}
                                        className={`${toggles[label] ? "bg-blue-600" : "bg-gray-200"
                                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                                        id={`toggle-${label}`}
                                    >
                                        <span
                                            className={`${toggles[label] ? "translate-x-6" : "translate-x-1"
                                                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                                        />
                                    </Switch>
                                    <label htmlFor={`toggle-${label}`} className="text-sm font-medium">
                                        {label}
                                    </label>
                                </div>
                            ))}
                            {Array(3 - group.length).fill(null).map((_, i) => (
                                <div key={`empty-${i}`} className="w-full" />
                            ))}
                        </div>
                    ))}
                </div> */}

        <div className="space-y-4">
          {chunkedToggles.map((group: any, rowIndex: any) => (
            <div key={rowIndex} className="flex justify-between gap-4">
              {group.map((label: any, index: any) => (
                <div
                  key={index}
                  className="flex flex-col items-start w-full space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={toggles[label]}
                      onChange={() => handleToggle(label)}
                      className={`${
                        toggles[label] ? "bg-blue-600" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      id={`toggle-${label}`}
                    >
                      <span
                        className={`${
                          toggles[label] ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                    <label
                      htmlFor={`toggle-${label}`}
                      className="text-sm font-medium"
                    >
                      {label}
                    </label>
                  </div>

                  {toggles[label] && (
                    <div className="mb-4" style={{ width: "50%" }}>
                      <div className="rounded-lg overflow-hidden">
                        <img
                          className="w-full h-auto"
                          src={getImageForLabel(label)}
                          alt={label}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {Array(3 - group.length)
                .fill(null)
                .map((_, i) => (
                  <div key={`empty-${i}`} className="w-full" />
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const settingsTab = () => (
    <div className="p-5 space-y-8">
      <div>
        <div className="mb-4">
          <Text variant="headingMd" as="h3">
            General Settings
          </Text>
        </div>

        <div className="space-y-4">
          {chunkedOptions.map((group: any, rowIndex: any) => (
            <div key={rowIndex} className="flex justify-between gap-4">
              {group.map((label: any, index: any) => (
                <div key={index} className="flex items-center space-x-2 w-full">
                  <input
                    type="checkbox"
                    id={`checkbox-${label}`}
                    checked={checkedItems[label]}
                    onChange={() => handleChange(label)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor={`checkbox-${label}`}
                    className="text-sm font-medium"
                  >
                    {label}
                  </label>
                </div>
              ))}
              {Array(3 - group.length)
                .fill(null)
                .map((_, i) => (
                  <div key={`empty-${i}`} className="w-full" />
                ))}
            </div>
          ))}
        </div>

        <div className="mb-4 mt-4">
          <Text variant="headingMd" as="h3">
            Shipping Settings
          </Text>
        </div>

        <div className="space-y-4">
          <div className="flex gap-40">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`checkbox-id`}
                checked={postPaid}
                onChange={() => handlePostPaid()}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor={`checkbox-id`} className="text-sm font-medium">
                Postpaid Privilege
              </label>
            </div>

            <div className="w-80">
              <TextField
                label="Credit limit"
                value={creditData}
                onChange={handleInputChange}
                placeholder="Enter the credit limit"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const transactionsTab = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="w-3/4 pr-4 w-100">
          <Select
            label=""
            placeholder="This Month"
            value="date"
            options={[
              { label: "Sort by date", value: "date" },
              { label: "Newest First", value: "newest" },
              { label: "Oldest First", value: "oldest" },
            ]}
            onChange={() => {}}
          />
        </div>

        <div className="w-1/4 flex justify-end space-x-2 w-10">
          <IconButton
            icon={PrintIcon}
            onClick={() => alert("Print")}
            ariaLabel="Print"
            className="cursor-pointer"
          />
          <IconButton
            icon={PrintIcon}
            onClick={() => alert("PDF")}
            ariaLabel="PDF"
            className="cursor-pointer"
          />
        </div>
      </div>
      <Card>
        <Tabs
          tabs={tranTabs}
          selected={selectedTranTab}
          onSelect={setSelectedTranTab}
        >
          <div className="mt-4">
            {selectedTranTab === 0 && tranCreditTab()}
            {selectedTranTab === 1 && "Hello"}
            {selectedTranTab === 2 && "Hello"}
            {selectedTranTab === 3 && "Hello"}
          </div>
        </Tabs>
      </Card>
    </>
  );

  const tranCreditTab = () => (
    <GenericDataTable
      columnContentTypes={["text", "text", "text", "text", "text"]}
      headings={[
        "Date Issued",
        "Bill Number",
        "Bill Type",
        "Payment Status",
        "Amount",
      ]}
      rows={bills.map((bill, i) => [
        bill.date || "-",
        "#1",
        "Cash",
        "Paid",
        "$100.00",
      ])}
      pagination={{
        totalCount: total,
        hasPrevious: currentPage > 1,
        hasNext: currentPage < Math.ceil(total / itemsPerPage),
        onPrevious: () => setCurrentPage(currentPage - 1),
        onNext: () => setCurrentPage(currentPage + 1),
        label: `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
          currentPage * itemsPerPage,
          total
        )} of ${total}`,
      }}
    />
  );
  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex items-center justify-between mb-6">
        <div className="w-3/4 pr-4 w-100">
          <Text as="h1" variant="headingLg" fontWeight="bold">
            New Purchase Bill
          </Text>
        </div>

        <div className="w-1/4 flex justify-end space-x-2 w-10">
          <Button
            className="cursor-pointer"
            variant="primary"
            onClick={handleSave}
          >
            Edit
          </Button>
          <Select
            label=""
            placeholder="More Actions"
            value="date"
            options={[
              { label: "Sort by date", value: "date" },
              { label: "Newest First", value: "newest" },
              { label: "Oldest First", value: "oldest" },
            ]}
            onChange={() => {}}
          />
        </div>
      </div>

      <div className="space-y-6 ">
        <Card>
          <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
            <div className="mt-4">
              {selectedTab === 0 && informationTab()}
              {selectedTab === 1 && customBrandingTab()}
              {selectedTab === 2 && settingsTab()}
              {selectedTab === 3 && transactionsTab()}
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
