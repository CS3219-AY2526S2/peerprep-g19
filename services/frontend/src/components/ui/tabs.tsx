"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultIndex?: number;
}

export function Tabs({ tabs, defaultIndex = 0 }: TabsProps) {
  const [active, setActive] = useState(defaultIndex);

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={cn(
              "px-6 py-2.5 text-sm font-medium transition-colors cursor-pointer",
              active === i
                ? "bg-[#5568EE] text-white rounded-t-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{tabs[active]?.content}</div>
    </div>
  );
}
