"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAllTopics, listQuestions } from "@/lib/api/question";
import { useToast } from "@/components/ui/toast";

const difficulties = ["Easy", "Medium", "Hard"] as const;

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
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const fetchTopics = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const results = await getAllTopics(searchQuery || undefined);
      setTopics(results);
    } catch {
      // Fallback to empty list on error
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchTopics(search);
    }, 200);

    return () => clearTimeout(timer);
  }, [search, fetchTopics]);

  useEffect(() => {
    fetchTopics("");
  }, [fetchTopics]);

  const handleStart = async () => {
    if (!difficulty || !topic) return;
    setStarting(true);
    try {
      const response = await listQuestions({ topic, difficulty, limit: 1 });
      if (response.total === 0) {
        toast(`No ${difficulty} questions available for ${topic}. Try a different combination.`, "error");
        return;
      }
      router.push(`/match/finding?difficulty=${encodeURIComponent(difficulty)}&topic=${encodeURIComponent(topic)}`);
    } catch {
      toast("Failed to verify question availability. Please try again.", "error");
    } finally {
      setStarting(false);
    }
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
          
          <Input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          <div className="grid grid-cols-3 gap-3">
            {loading ? (
              <div className="col-span-3 py-8 text-center text-gray-500 text-sm">
                Loading topics...
              </div>
            ) : topics.length === 0 ? (
              <div className="col-span-3 py-8 text-center text-gray-500 text-sm">
                No topics found
              </div>
            ) : (
              topics.map((t) => (
                <SelectCard
                  key={t}
                  label={t}
                  selected={topic === t}
                  onClick={() => setTopic(t)}
                />
              ))
            )}
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!difficulty || !topic || starting}
          onClick={handleStart}
        >
          {starting ? "Checking..." : "Start Matching"}
        </Button>
      </div>
    </div>
  );
}
