import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: "vault" | "successor";
  currentTier: string;
  currentCount: number;
  limit: number;
}

const upgradeInfo = {
  pro: {
    name: "Pro",
    price: "$7/mo",
    features: [
      "Unlimited vault entries",
      "Up to 5 successors",
      "Shamir's Secret Sharing",
      "Activity audit logs",
      "Priority support",
    ],
  },
  family: {
    name: "Family",
    price: "$15/mo",
    features: [
      "Everything in Pro",
      "Unlimited successors",
      "Per-entry access controls",
      "Custom inactivity thresholds",
      "Dedicated support",
    ],
  },
};

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  limitType,
  currentTier,
  currentCount,
  limit,
}) => {
  const navigate = useNavigate();

  const suggestedTier = currentTier === "free" ? "pro" : "family";
  const tierInfo = upgradeInfo[suggestedTier as keyof typeof upgradeInfo];

  const limitLabel = limitType === "vault" ? "vault entries" : "successors";

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>

                <div className="p-6 sm:p-8">
                  {/* Icon */}
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                    <SparklesIcon className="h-7 w-7 text-blue-600" />
                  </div>

                  {/* Title */}
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold text-gray-900 text-center"
                  >
                    You've reached your limit
                  </Dialog.Title>

                  {/* Description */}
                  <p className="mt-3 text-sm text-gray-600 text-center">
                    Your{" "}
                    <span className="font-medium capitalize">
                      {currentTier}
                    </span>{" "}
                    plan allows up to{" "}
                    <span className="font-semibold">
                      {limit} {limitLabel}
                    </span>
                    . You currently have{" "}
                    <span className="font-semibold">{currentCount}</span>.
                  </p>

                  {/* Upgrade card */}
                  <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-900">
                        {tierInfo.name}
                      </h4>
                      <span className="text-lg font-bold text-blue-600">
                        {tierInfo.price}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {tierInfo.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      onClick={() => {
                        onClose();
                        navigate("/billing");
                      }}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Upgrade to {tierInfo.name}
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default UpgradeModal;
