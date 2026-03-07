"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getQuestion } from "@/lib/api/question";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import type { Question } from "@/types/question";
import { ChevronDown, ChevronRight } from "lucide-react";

function HintAccordion({ hints }: { hints: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {hints.map((hint, i) => (
        <div key={i} className="rounded-md border border-gray-200">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            {openIndex === i ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Hint {i + 1}{openIndex !== i && " (click to expand)"}
          </button>
          {openIndex === i && (
            <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
              {hint}
            </div>
          )}
        </div>
      ))}
      {hints.length === 0 && <p className="text-sm text-gray-400">No hints available.</p>}
    </div>
  );
}

export default function QuestionViewPage() {
  const params = useParams();
  const { toast } = useToast();
  const titleParam = decodeURIComponent(params.title as string);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuestion(titleParam)
      .then(setQuestion)
      .catch(() => toast("Failed to load question", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleParam]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#5568EE]" /></div>;
  }

  if (!question) {
    return <p className="text-gray-500">Question not found.</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Badge variant="difficulty" difficulty={question.difficulty}>
          {question.difficulty}
        </Badge>
        <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {question.topics.map((topic) => (
          <Badge key={topic}>{topic}</Badge>
        ))}
      </div>

      <Tabs
        tabs={[
          {
            label: "Description",
            content: (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{question.description}</p>
              </div>
            ),
          },
          {
            label: "Hints",
            content: <HintAccordion hints={question.hints} />,
          },
          {
            label: "Model Answer",
            content: question.model_answer_code ? (
              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400 font-mono">
                {question.model_answer_code}
              </pre>
            ) : (
              <p className="text-sm text-gray-400">No model answer available.</p>
            ),
          },
        ]}
      />
    </div>
  );
}
