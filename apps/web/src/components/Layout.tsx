import React, { Fragment, useEffect, useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  LockClosedIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/ThemeContext";
import { realtimeClient } from "../services/realtime";
import clsx from "clsx";
import { SparklesIcon } from "@heroicons/react/24/solid";
import BrandMark from "./BrandMark";
import Footer from "./Footer";
import SkipLink from "./SkipLink";

const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Vault", href: "/vault", icon: LockClosedIcon },
  { name: "Successors", href: "/successors", icon: UserGroupIcon },
  { name: "Activity", href: "/activity", icon: ClipboardDocumentListIcon },
  { name: "Sessions", href: "/sessions", icon: ComputerDesktopIcon },
  { name: "Billing", href: "/billing", icon: CreditCardIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

const adminNavItem = {
  name: "Admin",
  href: "/admin",
  icon: ShieldCheckIcon,
};

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const { success } = useToast();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navigation =
    user?.role === "admin"
      ? [
          ...baseNavigation.slice(0, 5),
          adminNavItem,
          ...baseNavigation.slice(5),
        ]
      : baseNavigation;

  const isFreeTier =
    !user?.subscriptionTier || user.subscriptionTier === "free";

  useEffect(() => {
    const unsubReminder = realtimeClient.subscribe(
      "notification.reminder_sent",
      (payload) => {
        const reminderType = String(payload.reminderType || "activity");
        success(`Realtime alert: ${reminderType.replaceAll("_", " ")}`);
      },
    );

    const unsubHandover = realtimeClient.subscribe(
      "handover.status_changed",
      (payload) => {
        const status = String(payload.status || "updated").replaceAll("_", " ");
        success(`Handover status updated: ${status}`);
      },
    );

    return () => {
      unsubReminder();
      unsubHandover();
    };
  }, [success]);

  const sidebarContent = (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4 ring-1 ring-stone-200 dark:ring-gray-800 lg:ring-0 lg:border-r lg:border-stone-200 lg:dark:border-gray-800">
      <div className="flex h-16 shrink-0 items-center">
        <Link
          to={user ? "/dashboard" : "/"}
          className="flex items-center gap-2"
        >
          <BrandMark className="h-6 w-6" />
          <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
            Handoverkey
          </span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-0.5">
              {navigation.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        active
                          ? "bg-stone-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-gray-800/60",
                        "group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      )}
                    >
                      <item.icon
                        className={clsx(
                          active
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300",
                          "h-5 w-5 shrink-0 transition-colors",
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="mt-auto">
            {isFreeTier && (
              <Link
                to="/billing"
                className="mb-4 -mx-2 flex items-center gap-3 rounded-xl bg-amber-50/70 dark:bg-amber-900/20 ring-1 ring-amber-200/80 dark:ring-amber-800/40 p-3 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/90 group-hover:bg-amber-500 transition-colors">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Upgrade to Pro
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Unlimited secrets
                  </span>
                </div>
              </Link>
            )}
            <div className="-mx-2 flex flex-col gap-y-1 border-t border-stone-200 dark:border-gray-800 pt-4 mt-4">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-medium text-sm shrink-0">
                  {user?.name?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-stone-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white w-full transition-colors"
                aria-pressed={theme === "dark" ? "true" : "false"}
              >
                {theme === "dark" ? (
                  <SunIcon
                    className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-amber-500"
                    aria-hidden="true"
                  />
                ) : (
                  <MoonIcon
                    className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    aria-hidden="true"
                  />
                )}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                type="button"
                onClick={logout}
                className="group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 w-full transition-colors"
              >
                <ArrowRightOnRectangleIcon
                  className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-rose-500"
                  aria-hidden="true"
                />
                Log out
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      <SkipLink />
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50 lg:hidden"
            onClose={setSidebarOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/60" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button
                        type="button"
                        className="-m-2.5 p-2.5"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  {sidebarContent}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {sidebarContent}
        </div>

        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-stone-200 dark:border-gray-800 bg-[#FAF7F2]/80 dark:bg-gray-900/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 lg:hidden">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 items-center justify-end gap-x-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="-m-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                aria-pressed={theme === "dark" ? "true" : "false"}
              >
                {theme === "dark" ? (
                  <SunIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <MoonIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-medium text-sm shrink-0">
                  {user?.name?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
                <span
                  aria-hidden="true"
                  className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]"
                >
                  {user?.name || user?.email}
                </span>
              </div>
            </div>
          </div>

          <main
            id="main-content"
            className="bg-[#FAF7F2] dark:bg-gray-900 min-h-screen flex flex-col transition-colors"
          >
            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-10 max-w-6xl w-full mx-auto">
              <Outlet />
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
