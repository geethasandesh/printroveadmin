import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  ListBulletedIcon,
  PageAddIcon,
  ImagesIcon,
  WalletIcon,
  PageAttachmentIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CartIcon,
  OrdersStatusIcon,
  InventoryIcon,
  PrintIcon,
  CheckCircleIcon,
  ReturnIcon,
  SandboxIcon,
  CodeIcon,
  ViewIcon,
  LayoutHeaderIcon,
  PackageIcon,
  DeliveryFilledIcon,
  AlertCircleIcon,
  ExchangeIcon,
} from "@shopify/polaris-icons";
import Link from "next/link";

interface SubMenuItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
  to?: string;
}

const SidebarItem = ({
  icon,
  label,
  isActive,
  to,
  hasSubMenu,
  isExpanded,
  onClick,
  isSubMenuItem = false,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  to?: string;
  hasSubMenu?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  isSubMenuItem?: boolean;
}) => {
  const content = (
    <div
      className={`flex items-center justify-between px-2 py-2 rounded-lg transition-colors cursor-pointer ${
        isActive
          ? isSubMenuItem
            ? "bg-[#272727] text-white [&_svg]:text-white [&_svg]:fill-white" // Sub menu selected color
            : "bg-[#D0D0D0] text-[#202020] [&_svg]:text-[#202020] [&_svg]:fill-[#202020]" // Main menu selected color
          : "bg-transparent text-[#202020] hover:bg-[#F4F4F5]" // Default transparent
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {hasSubMenu && (
        <div className="w-5 h-5">
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </div>
      )}
    </div>
  );

  return to ? <Link href={to}>{content}</Link> : content;
};

const SubMenu = ({
  items,
  currentPath,
}: {
  items: SubMenuItem[];
  currentPath: string;
}) => (
  <div className="ml-8 flex flex-col gap-1">
    {items.map((item, index) => (
      <SidebarItem
        key={index}
        to={item.to}
        icon={item.icon}
        isActive={currentPath.startsWith(item.to)}
        label={item.label}
        isSubMenuItem={true}
      />
    ))}
  </div>
);

export const Sidebar = () => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const currentPath = usePathname();

  const menuItems: MenuItem[] = [
    {
      label: "Inventory",
      icon: <WalletIcon className="w-5 h-5" />,
      subItems: [
        {
          label: "Bin",
          to: "/printrove/bins",
          icon: <ListBulletedIcon className="w-5 h-5" />,
        },
        {
          label: "Products",
          to: "/printrove/product",
          icon: <PageAddIcon className="w-5 h-5" />,
        },
        {
          label: "Collections",
          to: "/printrove/collections",
          icon: <ImagesIcon className="w-5 h-5" />,
        },
        {
          label: "Print Configuration",
          to: "/printrove/printconfig",
          icon: <PageAttachmentIcon className="w-5 h-5" />,
        },
        {
          label: "Stock Adjustment",
          to: "/printrove/inventory-adjustments",
          icon: <WalletIcon className="w-5 h-5" />,
        },
      ],
    },
    // Added Putaway as a main menu item without sub-items

    {
      label: "Purchase",
      icon: <WalletIcon className="w-5 h-5" />,
      subItems: [
        {
          label: "Vendor",
          to: "/printrove/purchase/vendor",
          icon: <ListBulletedIcon className="w-5 h-5" />,
        },
        {
          label: "Purchase Order",
          to: "/printrove/purchase/po",
          icon: <PageAddIcon className="w-5 h-5" />,
        },
        {
          label: "Bills",
          to: "/printrove/purchase/bills",
          icon: <PageAttachmentIcon className="w-5 h-5" />,
        },
        {
          label: "Receivables",
          to: "/printrove/purchase/receivables",
          icon: <WalletIcon className="w-5 h-5" />,
        },
        {
          label: "Vendor Credit",
          to: "/printrove/purchase/credits",
          icon: <PageAttachmentIcon className="w-5 h-5" />,
        },
        {
          label: "Replenishment",
          to: "/printrove/purchase/replenishment",
          icon: <WalletIcon className="w-5 h-5" />,
        },
      ],
    },
    {
      label: "Orders",
      icon: <WalletIcon className="w-5 h-5" />,
      subItems: [
        {
          label: "Orders",
          to: "/printrove/orders",
          icon: <OrdersStatusIcon className="w-5 h-5" />,
        },
        // Add more order-related submenu items here as needed
      ],
    },
    {
      label: "Production",
      icon: <WalletIcon className="w-5 h-5" />,
      subItems: [
        {
          label: "Planning",
          to: "/printrove/production/planning",
          icon: <OrdersStatusIcon className="w-5 h-5" />,
        },
        {
          label: "Batches",
          to: "/printrove/production/batch",
          icon: <CodeIcon className="w-5 h-5" />,
        },
        {
          label: "Picking",
          to: "/printrove/production/picking",
          icon: <CheckCircleIcon className="w-5 h-5" />,
        },
        {
          label: "Putback",
          to: "/printrove/production/putback",
          icon: <ReturnIcon className="w-5 h-5" />,
        },
        {
          label: "Preview",
          to: "/printrove/production/preview",
          icon: <ViewIcon className="w-5 h-5" />,
        },
        {
          label: "Printing",
          to: "/printrove/production/printing",
          icon: <PrintIcon className="w-5 h-5" />,
        },
        {
          label: "Quality Control",
          to: "/printrove/production/qc",
          icon: <SandboxIcon className="w-5 h-5" />,
        },
        {
          label: "Kitting",
          to: "/printrove/production/kitting",
          icon: <LayoutHeaderIcon className="w-5 h-5" />, // Adjust icon as needed
        },
        {
          label: "Packing", // Add this new menu item
          to: "/printrove/production/packing",
          icon: <PackageIcon className="w-5 h-5" />, // Using PackageIcon for Packing
        },
        {
          label: "Dispatch", // Add this new menu item
          to: "/printrove/production/dispatch",
          icon: <DeliveryFilledIcon className="w-5 h-5" />, // Use appropriate icon
        },
      ],
    },
    {
      label: "Returns",
      icon: <ExchangeIcon className="w-5 h-5" />,
      subItems: [
        {
          label: "Return Manifests",
          to: "/printrove/returns/manifest",
          icon: <DeliveryFilledIcon className="w-5 h-5" />,
        },
        {
          label: "Reverse Logistics",
          to: "/printrove/reverse/manifest",
          icon: <ReturnIcon className="w-5 h-5" />,
        },
      ],
    },
    {
      label: "Putaway",
      icon: <InventoryIcon className="w-5 h-5" />,
      to: "/printrove/putaway",
    },
    {
      label: "Merchants",
      icon: <CartIcon className="w-5 h-5" />,
      subItems: [
        {
          label: "Merchants",
          to: "/printrove/merchants",
          icon: <ListBulletedIcon className="w-5 h-5" />,
        },
      ],
    },
  ];

  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuLabel)
        ? prev.filter((item) => item !== menuLabel)
        : [...prev, menuLabel]
    );
  };

  return (
    <div className="w-[265px] bg-[#EBEBEB] h-screen flex flex-col">
      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
        <nav className="flex flex-col gap-2">
          {menuItems.map((item, index) => (
            <div key={index} className="flex flex-col gap-1">
              <SidebarItem
                icon={item.icon}
                label={item.label}
                isActive={currentPath.startsWith(item.to || "")}
                to={item.to}
                hasSubMenu={!!item.subItems}
                isExpanded={expandedMenus.includes(item.label)}
                onClick={() => item.subItems && toggleMenu(item.label)}
              />
              {item.subItems && expandedMenus.includes(item.label) && (
                <SubMenu items={item.subItems} currentPath={currentPath} />
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};
