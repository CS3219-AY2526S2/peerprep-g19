"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listQuestions, deleteQuestion, getQuestionStats } from "@/lib/api/question";
import type { ListQuestionsResponse, QuestionStats } from "@/lib/api/question";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { getDifficultyColor } from "@/lib/utils";
import type { Question } from "@/types/question";

const PAGE_SIZE = 20;

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function AdminQuestionsPage() {
  const { toast } = useToast();

  // Server-driven list state
  const [response, setResponse] = useState<ListQuestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Stats
  const [stats, setStats] = useState<QuestionStats | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchQuestions = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await listQuestions({
        skip: (pageNum - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        search: debouncedQuery || undefined,
        difficulty: difficultyFilter || undefined,
        topic: topicFilter || undefined,
      });
      setResponse(data);
    } catch {
      toast("Failed to load questions", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, difficultyFilter, topicFilter, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getQuestionStats();
      setStats(data);
    } catch {
      // Stats are non-critical, silently fail
    }
  }, []);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset to page 1 and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchQuestions(1);
  }, [debouncedQuery, difficultyFilter, topicFilter, fetchQuestions]);

  // Fetch when page changes (but not on filter change — that's handled above)
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchQuestions(newPage);
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteQuestion(deleteTarget.title);
      toast(`Deleted "${deleteTarget.title}"`, "success");
      setDeleteTarget(null);
      setDeleteConfirm("");
      fetchQuestions(page);
      fetchStats();
    } catch {
      toast("Failed to delete question", "error");
    } finally {
      setDeleting(false);
    }
  };

  const questions = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const difficultyCounts = stats?.difficulty_counts ?? {};
  const allTopics = stats?.topics ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <Link href="/admin/questions/new/edit">
          <Button>+ Add Question</Button>
        </Link>
      </div>

      {/* Stats Widget */}
      {stats && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          {(["Easy", "Medium", "Hard"] as const).map((d) => (
            <div key={d} className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <div className={`text-2xl font-bold ${getDifficultyColor(d).split(" ")[0]}`}>
                {difficultyCounts[d] ?? 0}
              </div>
              <div className="text-sm text-gray-500">{d}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5568EE] focus:outline-none focus:ring-1 focus:ring-[#5568EE]"
        />
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5568EE] focus:outline-none focus:ring-1 focus:ring-[#5568EE]"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5568EE] focus:outline-none focus:ring-1 focus:ring-[#5568EE]"
        >
          <option value="">All Topics</option>
          {allTopics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Topics</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Difficulty</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-[#5568EE]" />
                </td>
              </tr>
            ) : questions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  {debouncedQuery || difficultyFilter || topicFilter
                    ? "No questions match your filters."
                    : "No questions yet. Add your first one!"}
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q._id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{q.title}</td>
                  <td className="px-4 py-3 text-gray-600">{q.topics.join(", ")}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${getDifficultyColor(q.difficulty).split(" ")[0]}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <Link
                      href={`/admin/questions/${encodeURIComponent(q.title)}/edit`}
                      className="text-[#5568EE] hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(q)}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={() => { setDeleteTarget(null); setDeleteConfirm(""); }}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-600 text-center">Confirm Deletion</h2>
          <p className="text-center text-gray-600">Type &quot;DELETE&quot; to confirm</p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="flex justify-end">
            <Button variant="danger" disabled={deleteConfirm !== "DELETE" || deleting} onClick={handleDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
