"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const difficulties = ["Easy", "Medium", "Hard"] as const;
const topics = ["Arrays", "Graphs", "DP", "Trees", "Strings", "Sorting"] as const;

function SelectCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border-2 px-6 py-3 text-sm font-medium transition-all cursor-pointer",
        selected
          ? "border-[#5568EE] text-[#5568EE] bg-blue-50"
          : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white",
      )}
    >
      {label}
    </button>
  );
}

export default function MatchPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  const handleStart = () => {
    if (!difficulty || !topic) return;
    router.push(`/match/finding?difficulty=${encodeURIComponent(difficulty)}&topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="flex flex-col items-center pt-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Find a Match</h1>

      <div className="w-full max-w-xl space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Select Difficulty</h2>
          <div className="grid grid-cols-3 gap-3">
            {difficulties.map((d) => (
              <SelectCard
                key={d}
                label={d}
                selected={difficulty === d}
                onClick={() => setDifficulty(d)}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Select Topic</h2>
          <div className="grid grid-cols-3 gap-3">
            {topics.map((t) => (
              <SelectCard
                key={t}
                label={t}
                selected={topic === t}
                onClick={() => setTopic(t)}
              />
            ))}
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!difficulty || !topic}
          onClick={handleStart}
        >
          Start Matching
        </Button>
      </div>
    </div>
  );
}
