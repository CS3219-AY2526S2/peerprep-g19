"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getQuestion, upsertQuestion } from "@/lib/api/question";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const idParam = (params.title as string) || "new"; // Note: URL param is still [title] but contains the ID or "new"
  const isNew = idParam === "new";

  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [description, setDescription] = useState("");
  const [topicsStr, setTopicsStr] = useState("");
  const [hints, setHints] = useState<string[]>([""]);
  const [modelAnswerCode, setModelAnswerCode] = useState("");
  const [modelAnswerLang, setModelAnswerLang] = useState<string>("");
  const [version, setVersion] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");

  const MAX_IMAGES = 3;
  const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Unable to read file as Base64."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(file);
    });

  const handleImagesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      setImageError(`Please select at most ${MAX_IMAGES} images.`);
      event.target.value = "";
      return;
    }

    try {
      const nextImages = await Promise.all(
        files.map(async (file) => {
          if (!file.type.startsWith("image/")) {
            throw new Error(`'${file.name}' is not a supported image file.`);
          }
          if (file.size > MAX_IMAGE_SIZE) {
            throw new Error(`'${file.name}' exceeds the 4 MB limit.`);
          }
          return await fileToBase64(file);
        }),
      );
      setImages((current) => [...current, ...nextImages]);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to add image files.");
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isNew) return;
    getQuestion(idParam)
      .then((q) => {
        setId(q._id);
        setTitle(q.title);
        setDifficulty(q.difficulty);
        setDescription(q.description);
        setTopicsStr(q.topics.join(", "));
        setHints(q.hints.length > 0 ? q.hints : [""]);
        setModelAnswerCode(q.model_answer_code || "");
        setModelAnswerLang(q.model_answer_lang || "");
        setImages(q.images ?? []);
        setVersion(q.version);
      })
      .catch(() => toast("Failed to load question", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !topicsStr || !difficulty) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const topics = topicsStr.split(",").map((t) => t.trim()).filter(Boolean);
      const filteredHints = hints.filter((h) => h.trim());
      await upsertQuestion({
        ...(id && { _id: id }),
        title,
        description,
        topics,
        difficulty,
        hints: filteredHints,
        images: images.length > 0 ? images : undefined,
        model_answer_code: modelAnswerCode || undefined,
        model_answer_lang: modelAnswerLang || undefined,
        version,
      });
      toast(isNew ? "Question created!" : "Question updated!", "success");
      router.push("/admin/questions");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#5568EE]" /></div>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isNew ? "Add New Question" : "Edit Question"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Question Name *"
            placeholder="e.g. Two Sum"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isNew}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Difficulty *</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5568EE] focus:outline-none focus:ring-1 focus:ring-[#5568EE]"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem statement..."
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#5568EE] focus:outline-none focus:ring-1 focus:ring-[#5568EE]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Topics *"
            placeholder="e.g. Arrays, Hashing"
            value={topicsStr}
            onChange={(e) => setTopicsStr(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Optional fields:</label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesSelected}
                className="text-sm text-gray-600"
              />
              <p className="text-xs text-slate-500">Upload up to {MAX_IMAGES} images. Each image must be 4 MB or smaller.</p>
            </div>
          </div>
        </div>
        {imageError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{imageError}</p>
          </div>
        )}
        {images.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Selected images</p>
            <div className="grid grid-cols-3 gap-3">
              {images.map((image, index) => (
                <div key={index} className="rounded-lg border border-gray-200 overflow-hidden">
                  <img src={image} alt={`Selected image ${index + 1}`} className="h-28 w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 p-2">
                    <p className="text-xs text-gray-600">Image {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveImage(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Hints (up to 3)</label>
          {hints.map((hint, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={hint}
                onChange={(e) => {
                  const next = [...hints];
                  next[i] = e.target.value;
                  setHints(next);
                }}
                placeholder={`Hint ${i + 1}`}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#5568EE] focus:outline-none focus:ring-1 focus:ring-[#5568EE]"
              />
              {hints.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setHints(hints.filter((_, j) => j !== i))}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          {hints.length < 3 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setHints([...hints, ""])}>
              + Add Hint
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Model Answer</label>
          <div className="flex gap-2 mb-2">
            <select
              value={modelAnswerLang}
              onChange={(e) => setModelAnswerLang(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#5568EE] focus:outline-none focus:ring-1 focus:ring-[#5568EE]"
            >
              <option value="">Select language</option>
              <option value="py">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          </div>
          <textarea
            value={modelAnswerCode}
            onChange={(e) => setModelAnswerCode(e.target.value)}
            placeholder="Paste model answer code..."
            rows={8}
            className="w-full font-mono rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#5568EE] focus:outline-none focus:ring-1 focus:ring-[#5568EE]"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Saving..." : "Save Question"}
        </Button>
      </form>
    </div>
  );
}
