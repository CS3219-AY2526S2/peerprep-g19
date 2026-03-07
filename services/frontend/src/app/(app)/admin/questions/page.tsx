"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listQuestions, deleteQuestion } from "@/lib/api/question";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { getDifficultyColor } from "@/lib/utils";
import type { Question } from "@/types/question";

export default function AdminQuestionsPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchQuestions = async () => {
    try {
      const data = await listQuestions();
      setQuestions(data);
    } catch {
      toast("Failed to load questions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteQuestion(deleteTarget.title);
      setQuestions((prev) => prev.filter((q) => q._id !== deleteTarget._id));
      toast(`Deleted "${deleteTarget.title}"`, "success");
      setDeleteTarget(null);
      setDeleteConfirm("");
    } catch {
      toast("Failed to delete question", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#5568EE]" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <Link href="/admin/questions/new/edit">
          <Button>+ Add Question</Button>
        </Link>
      </div>

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
            {questions.map((q) => (
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
            ))}
            {questions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No questions yet. Add your first one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
