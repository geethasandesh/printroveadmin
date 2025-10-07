"use client";

import React, { useState, useEffect } from "react";
import { TextField, Select, Card, Badge } from "@shopify/polaris";
import { Button } from "@/app/components/Button";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { useMerchantsStore } from "@/store/useMerchantsStore";
import Link from "next/link";

export default function MerchantsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { merchants, total, isLoading, fetchMerchants } = useMerchantsStore();

  useEffect(() => {
    fetchMerchants(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const handleView = (id: any) => {
    // router.push(`/printrove/merchants/others/create?billNumber=${num}`);
    router.push(`/printrove/merchants/others?id=${id}`);
  };

  return (
    <div>
      <div className="h-full p-8 bg-[#F5F5F5]">
        <div className="flex justify-between items-center mb-6">
          <b className="text-2xl font-extrabold">Merchants</b>
          <div className="flex-1 max-w-[40%]">
            <TextField
              label=""
              placeholder="Search by Merchant Id, Phone Number or Email Id"
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
              "text",
            ]}
            headings={[
              "S.No",
              "User Created",
              "Merchants ID #",
              "Name",
              "Brand Name",
              "Company Name",
              "Email ID",
            ]}
            rows={merchants.flatMap((mer: any, merIndex: number) =>
              mer.user_list.map((user: any, userIndex: number) => {
                const globalIndex =
                  (currentPage - 1) * itemsPerPage + merIndex + 1;

                return [
                  `${globalIndex}.`,
                  formatDate(user.created_date),
                  <Link
                    href="#"
                    className="text-[#005BD3] underline"
                    key={`link-${mer._id}-${userIndex}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleView(mer._id);
                    }}
                  >
                    {mer._id || "-"}
                  </Link>,
                  user.name || "-",
                  mer.business_and_banking_info.store_name || "-",
                  mer.business_and_banking_info.company_name || "-",
                  user.email_id || "-",
                ];
              })
            )}
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
        </Card>

        {isLoading && <div>Loading...</div>}
      </div>
    </div>
  );
}
