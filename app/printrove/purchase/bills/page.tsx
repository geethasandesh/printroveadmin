"use client";

import React, { useState, useEffect } from "react";
import { TextField, Select, Card } from "@shopify/polaris";
import { SearchIcon, OutboundIcon } from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { useBillStore } from "@/store/useBillStore";
import { Button } from "@/app/components/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BillsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { bills, total, isLoading, fetchBills } = useBillStore();

  useEffect(() => {
    fetchBills(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const [summaryData, setSummaryData] = useState({
    totalOutstanding: 0,
    dueToday: 0,
    dueWithin30Days: 0,
    overdueBills: 0,
  });

  useEffect(() => {
    // Fetch data from the API

    // Sample data
    const fetchSummaryData = async () => {
      try {
        const response = await fetch("/api/bills/summary");
        if (response.ok) {
          const data = await response.json();
          setSummaryData({
            totalOutstanding: data.totalOutstanding || 0,
            dueToday: data.dueToday || 0,
            dueWithin30Days: data.dueWithin30Days || 0,
            overdueBills: data.overdueBills || 0,
          });
        } else {
          console.error("Failed to fetch summary data");
        }
      } catch (error) {
        console.error("Error fetching summary data:", error);
      }
    };

    fetchSummaryData();
  }, []);

  const handleView = (num: any) => {
    router.push(`/printrove/purchase/bills/${num}`);
  };

  // Static
  const handleExport = async () => {
    alert("Exporting data...");
    const payload = { startDate: "2025-05-11", endDate: "2025-05-11" };
    // try{
    //   const response = await fetch("/api", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(payload),
    //   });

    //   if(response.status === 200){
    //     const blob = await response.blob();
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement("a");
    //     a.href = url;
    //     a.download = "bills.xlsx";
    //     document.body.appendChild(a);
    //     a.click();
    //     window.URL.revokeObjectURL(url);
    //     a.remove();
    //   }
    // } catch(err) {
    //   console.error("Error exporting data:", err);
    // }
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <b className="text-2xl font-extrabold">Purchase Bills</b>
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/printrove/purchase/bills/create")}
          >
            <span>+ Create</span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleExport}
          >
            <OutboundIcon className="w-5 h-5" />
            Export Data
          </Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-4 divide-x divide-gray-300">
          <div className="p-4 text-center">
            <h3>Total Outstanding Payables</h3>
            <p className="text-lg font-extrabold mt-2">
              {summaryData.totalOutstanding.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-4 text-center">
            <h3>Due Today</h3>
            <p className="text-2xl font-extrabold mt-2">
              {summaryData.dueToday.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-4 text-center">
            <h3>Due Within 30 Days</h3>
            <p className="text-2xl font-extrabold mt-2">
              {summaryData.dueWithin30Days.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-4 text-center">
            <h3>Overdue Bills</h3>
            <p className="text-2xl font-extrabold mt-2">
              {summaryData.overdueBills.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center mt-4 mb-4">
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
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search bills"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
            autoComplete="off"
          />
        </div>
      </div>

      <Card>
        <GenericDataTable
          columnContentTypes={[
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
            "numeric",
          ]}
          headings={[
            "",
            "Date",
            "Purchase Bill",
            "Reference Number",
            "Vendor Name",
            "Status",
            "Amount",
          ]}
          rows={bills.map((bill, i) => [
            <input type="checkbox" key={i} />,
            formatDate(bill.date),
            <Link
              href="#"
              className="text-[#005BD3] underline"
              key={"L" + i}
              onClick={(e) => {
                e.preventDefault();
                handleView(bill.id);
              }}
            >
              {bill.bill_number}
            </Link>,
            bill.reference_number || "-",
            bill.vendor_name,
            bill.status,
            formatCurrency(bill.total),
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
    </div>
  );
}
