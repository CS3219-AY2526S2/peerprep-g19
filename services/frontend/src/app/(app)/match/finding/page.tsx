"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { startMatching, cancelMatching, type MatchResult } from "@/lib/api/matching";
import { useToast } from "@/components/ui/toast";

const TIMEOUT_SECONDS = 30;

function FindingMatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const difficulty = searchParams.get("difficulty") || "Medium";
  const topic = searchParams.get("topic") || "Arrays";

  const [countdown, setCountdown] = useState(TIMEOUT_SECONDS);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // TODO: PLACEHOLDER — Queue position is hardcoded, should come from matching service
  const queuePosition = 3;

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          cleanup();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    startMatching(difficulty, topic).then((result) => {
      if (result) {
        cleanup();
        setMatch(result);
      }
    });

    return () => {
      cleanup();
      cancelMatching();
    };
  }, [difficulty, topic, cleanup]);

  useEffect(() => {
    if (countdown === 0 && !match && !cancelled) {
      toast("No match found. Try again.", "error");
      router.push("/match");
    }
  }, [countdown, match, cancelled, router, toast]);

  const handleCancel = () => {
    setCancelled(true);
    cancelMatching();
    cleanup();
    router.push("/match");
  };

  const handleJoinSession = () => {
    if (!match) return;
    router.push(`/session/${match.sessionId}?question=${encodeURIComponent(match.questionTitle)}&difficulty=${encodeURIComponent(difficulty)}`);
  };

  if (match) {
    return (
      <div className="flex flex-col items-center pt-16 text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-2">Match Found!</h1>
        <p className="text-gray-500 mb-8">You&apos;ve been paired!</p>

        <div className="flex gap-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full border-3 border-blue-500 flex items-center justify-center bg-blue-50">
              <span className="text-blue-500 font-bold">You</span>
            </div>
            <span className="mt-2 text-sm text-gray-600">You</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full border-3 border-orange-500 flex items-center justify-center bg-orange-50">
              <span className="text-orange-500 font-bold text-xs">{match.partnerName.charAt(0)}</span>
            </div>
            <span className="mt-2 text-sm text-gray-600">Partner</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">Session is ready</p>

        <Button size="lg" className="px-12" onClick={handleJoinSession}>
          Join Session
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finding Match...</h1>

      <div className="mb-4">
        <div className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-[#5568EE] animate-spin-slow" />
      </div>

      <p className="text-sm text-gray-500 mb-2">
        {difficulty} &middot; {topic}
      </p>
      <p className="text-lg font-bold mb-1">Queue position: #{queuePosition}</p>
      <p className="text-sm text-gray-400 mb-8">Timeout in {countdown}s</p>

      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
    </div>
  );
}

export default function FindingMatchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#5568EE]" /></div>}>
      <FindingMatchContent />
    </Suspense>
  );
}
