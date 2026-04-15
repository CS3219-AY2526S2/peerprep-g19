"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useCollaboration } from "@/hooks/use-collaboration";
import { CodeEditor } from "@/components/collaboration/code-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { getQuestion } from "@/lib/api/question";
import { createAttempt } from "@/lib/api/user";
import { explainCode, type AIExplainResult } from "@/lib/api/ai";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_FILE_EXTENSIONS,
  type SupportedLanguage,
} from "@/types/collaboration";
import type { Question } from "@/types/question";
import { ChevronDown, ChevronRight, ImageIcon, Lightbulb } from "lucide-react";
import Image from "next/image";

function SessionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const sessionId = params.id as string;
  const questionTitle = searchParams.get("question") || "";
  const difficulty = searchParams.get("difficulty") || "";
  const topic = searchParams.get("topic") || "";

  const [question, setQuestion] = useState<Question | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<"question" | "model_answer">("question");
  const [expandedHint, setExpandedHint] = useState<number | null>(null);
  const [imagesExpanded, setImagesExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIExplainResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  const {
    ytext,
    awareness,
    undoManager,
    connected,
    userCount,
    language,
    sessionEnded,
    endedBy,
    partnerDisconnected,
    endSession,
    changeLanguage,
    messages,
    sendChatMessage,
  } = useCollaboration({
    sessionId,
    userId: user?.id || "anonymous",
    username: user?.username || "Anonymous",
  });

  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = chatInputRef.current;
    if (!input || !input.value.trim()) return;
    
    sendChatMessage(input.value.trim());
    input.value = "";
  };

  // Load question data
  useEffect(() => {
    if (!questionTitle) return;
    getQuestion(questionTitle)
      .then(setQuestion)
      .catch(() => {
        setQuestion({
          _id: "mock",
          title: questionTitle,
          description: "Question data unavailable. The question service may be offline.",
          topics: [],
          difficulty: (difficulty as "Easy" | "Medium" | "Hard") || "Medium",
          hints: [],
          images: [],
          version: 1,
        });
      });
  }, [questionTitle, difficulty]);

  const recordAttempt = useRef(false);

  const saveAttempt = async () => {
    if (recordAttempt.current || !user?.id || !questionTitle || !topic || !difficulty) return;
    recordAttempt.current = true;
    const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
    try {
      await createAttempt(user.id, {
        questionTitle,
        topic,
        difficulty: difficulty as "Easy" | "Medium" | "Hard",
        status: "attempted",
        durationSeconds,
        language,
        sessionId,
      });
    } catch {
      // Non-critical — don't block the redirect
    }
  };

  // Handle session end (triggered by remote user or server)
  useEffect(() => {
    if (sessionEnded) {
      saveAttempt();
      toast(`Session ended by ${endedBy}`, "info");
      setTimeout(() => router.push("/match"), 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEnded]);

  // Handle partner disconnect
  useEffect(() => {
    if (partnerDisconnected) {
      toast("Partner disconnected", "error");
    }
  }, [partnerDisconnected, toast]);

  const handleExplainCode = async () => {
    if (!ytext || !ytext.toString().trim()) {
      setAiError("Please write some code first");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const result = await explainCode({
        code: ytext.toString(),
        language,
        questionTitle: questionTitle || "unknown",
        focus: "general",
      });
      setAiResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to explain code";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEndSession = async () => {
    setShowEndModal(false);
    endSession();
    toast("Session ended", "info");
    await saveAttempt();
    setTimeout(() => router.push("/match"), 1000);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-2 text-white">
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-gray-400">Session #{sessionId}</span>
          <span className="text-sm text-gray-400">
            {difficulty} &middot; {questionTitle}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-300">You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${userCount >= 2 ? "bg-orange-500" : "bg-gray-600"}`} />
            <span className="text-xs text-gray-300">Partner</span>
          </div>
          {!connected && <span className="text-xs text-yellow-400">Connecting...</span>}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — question / model answer tabs */}
        <div className="w-[40%] flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-gray-200">
            <button
              onClick={() => setActiveLeftTab("question")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeLeftTab === "question"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Question
            </button>
            <button
              onClick={() => question?.model_answer_code && setActiveLeftTab("model_answer")}
              disabled={!question?.model_answer_code}
              title={!question?.model_answer_code ? "No model answer available" : undefined}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeLeftTab === "model_answer"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } ${!question?.model_answer_code ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Lightbulb size={13} />
              Model Answer
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
          {question && (
            <>
          {activeLeftTab === "question" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{question.title}</h2>
              </div>
              <Badge variant="difficulty" difficulty={question.difficulty} className="mb-4">
                {question.difficulty}
              </Badge>

              <div className="prose prose-sm max-w-none mb-6">
                <p className="whitespace-pre-wrap text-gray-700">{question.description}</p>
              </div>

              {question.hints.length > 0 && (
                <div className="space-y-2 mb-6">
                  {question.hints.map((hint, i) => (
                    <div key={i} className="rounded-md border border-gray-200">
                      <button
                        onClick={() => setExpandedHint(expandedHint === i ? null : i)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        {expandedHint === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        Hint {i + 1}{expandedHint !== i && " (click to expand)"}
                      </button>
                      {expandedHint === i && (
                        <div className="border-t border-gray-200 px-3 py-2 text-sm text-gray-600">
                          {hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Box - Placed exactly above End Session button */}
              <div className="mb-4 rounded-md border border-gray-200 bg-gray-50">
                <div className="px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">Chat</h3>
                </div>
                
                <div 
                  ref={chatScrollRef}
                  className="h-75 overflow-y-auto p-3 space-y-2"
                >
                  {messages.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center">No messages yet</p>
                  ) : (
                    messages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`text-xs ${msg.userId === user?.id ? 'text-right' : 'text-left'}`}
                      >
                        <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 ${
                          msg.userId === user?.id 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {msg.userId !== user?.id && (
                            <p className="font-semibold mb-1">{msg.username}</p>
                          )}
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-200">
                  <input
                    ref={chatInputRef}
                    type="text"
                    placeholder="Type a message..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </form>
              </div>

              {/* AI Assist Panel */}
              <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">AI Assist</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExplainCode}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Explaining..." : "Explain My Code"}
                  </Button>
                </div>

                {aiError && (
                  <div className="mb-3 rounded bg-red-50 p-2 text-xs text-red-700">
                    {aiError}
                  </div>
                )}

                {aiResult && (
                  <div className="space-y-3 text-xs text-gray-700">
                    <div>
                      <p className="font-semibold text-gray-800 mb-1">Summary</p>
                      <p className="text-gray-600">{aiResult.summary}</p>
                    </div>

                    {aiResult.stepByStep.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">Step by Step</p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          {aiResult.stepByStep.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResult.keyConcepts.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">Key Concepts</p>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.keyConcepts.map((concept, i) => (
                            <span
                              key={i}
                              className="inline-block rounded bg-gray-200 px-2 py-1 text-xs text-gray-700"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiResult.potentialIssues.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">Potential Issues</p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          {aiResult.potentialIssues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-gray-800 mb-1">Confidence</p>
                      <p className="text-gray-600">
                        {(aiResult.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="prose prose-sm max-w-none mb-6">
                <p className="whitespace-pre-wrap text-gray-700">{question.description}</p>
              </div>

              {question.images && question.images.length > 0 && (
                <div className="mb-6 rounded-md border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setImagesExpanded(!imagesExpanded)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ImageIcon size={14} className="text-gray-500" />
                      Images ({question.images.length})
                    </span>
                    {imagesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {imagesExpanded && (
                    <div className="border-t border-gray-200 p-3 space-y-3">
                      {/* Thumbnail strip */}
                      {question.images.length > 1 && (
                        <div className="flex gap-2">
                          {question.images.map((src, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveImage(i)}
                              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                                activeImage === i
                                  ? "border-blue-500"
                                  : "border-gray-200 hover:border-gray-400"
                              }`}
                            >
                              <Image
                                src={src}
                                alt={`Thumbnail ${i + 1}`}
                                fill
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Main image */}
                      <div className="relative w-full overflow-hidden rounded-md bg-gray-100" style={{ minHeight: "180px" }}>
                        <Image
                          src={question.images[activeImage]}
                          alt={`Question image ${activeImage + 1}`}
                          width={600}
                          height={400}
                          className="w-full h-auto object-contain"
                        />
                      </div>

                      {question.images.length > 1 && (
                        <p className="text-center text-xs text-gray-400">
                          {activeImage + 1} / {question.images.length}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {question.hints.length > 0 && (
                <div className="space-y-2 mb-6">
                  {question.hints.map((hint, i) => (
                    <div key={i} className="rounded-md border border-gray-200">
                      <button
                        onClick={() => setExpandedHint(expandedHint === i ? null : i)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        {expandedHint === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        Hint {i + 1}{expandedHint !== i && " (click to expand)"}
                      </button>
                      {expandedHint === i && (
                        <div className="border-t border-gray-200 px-3 py-2 text-sm text-gray-600">
                          {hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="danger" className="flex-1" onClick={() => setShowEndModal(true)}>
                  End Session
                </Button>
              </div>
            </>
          )}

          {/* Model Answer tab */}
          {activeLeftTab === "model_answer" && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={18} className="text-yellow-500" />
                <h2 className="text-lg font-semibold">Model Answer</h2>
                {question?.model_answer_lang && (
                  <span className="text-xs text-gray-400 font-mono bg-gray-100 rounded px-2 py-1 ml-auto">
                    {question.model_answer_lang}
                  </span>
                )}
              </div>

              {question?.model_answer_code ? (
                <div className="flex flex-col space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Solution</p>
                  <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100 leading-relaxed">
                    <code>{question.model_answer_code}</code>
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-gray-400 py-16">
                  <Lightbulb size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">No model answer available for this question.</p>
                </div>
              )}
            </>
          )}
            </>
          )}
          </div>
        </div>

        {/* Right panel — code editor */}
        <div className="flex-1 flex flex-col bg-[#282c34]">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
            <span className="text-sm text-gray-400 font-mono">
              {LANGUAGE_FILE_EXTENSIONS[language]}
            </span>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </option>
              ))}
            </select>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {ytext && awareness && undoManager ? (
              <CodeEditor
                ytext={ytext}
                awareness={awareness}
                language={language}
                undoManager={undoManager}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Connecting to session...
              </div>
            )}
          </div>
        </div>
      </div>


      {/* End session modal */}
      <Modal open={showEndModal} onClose={() => setShowEndModal(false)}>
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold">End Session?</h2>
          <p className="text-gray-600">
            Are you sure? This will end the session for both users.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEndModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function SessionRoom() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#5568EE]" /></div>}>
      <SessionContent />
    </Suspense>
  );
}
