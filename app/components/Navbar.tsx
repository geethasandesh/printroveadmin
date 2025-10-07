import { CartIcon, PersonIcon } from "@shopify/polaris-icons";
import Image from "next/image";
import Link from "next/link";
import NotificationBell from "./NotificationBell";

export function Navbar() {
  return (
    <div className="max-w-screen flex gap-10 justify-between p-3 pr-9 bg-black text-white">
      <div className="flex items-center flex-shrink-0">
        <Link href="/">
          <Image
            alt="logo"
            src="/logo.svg"
            width={120}
            height={24}
            className="h-6"
          />
        </Link>
      </div>
      <div className="flex gap-2 items-center">
        <button className="items-center justify-center w-10 h-10 rounded-full fill-white p-2.5 hover:bg-navbar-dark-700">
          <CartIcon />
        </button>
        <div className="fill-white">
          <NotificationBell />
        </div>
        <button className="items-center justify-center w-10 h-10 rounded-full fill-white p-2.5 hover:bg-navbar-dark-700">
          <PersonIcon />
        </button>
        <button className="text-center text-sm w-30 h-10 rounded-xl bg-navbar-dark-700 hover:border-1 border-gray-600">
          New Order
        </button>
      </div>
    </div>
  );
}
