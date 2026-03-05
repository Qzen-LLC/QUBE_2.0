"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, FileText, RotateCcw, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArchitectOutputDashboard } from "@/components/architect/ArchitectOutputDashboard";
import { PipelineProgressTracker } from "@/components/architect/PipelineProgressTracker";
import { useArchitectSession } from "@/hooks/useArchitectSession";
import { useArchitectPipeline, type PipelineStep } from "@/hooks/useArchitectPipeline";

interface UseCase {
  title: string;
  department: string;
  owner: string;
  aiucId: number;
  stage: string;
  problemStatement?: string;
  proposedAISolution?: string;
  aiType?: string | null;
}

export default function UseCaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const useCaseId = params.useCaseId as string;

  const { session: architectSession, isLoading: architectLoading } =
    useArchitectSession(useCaseId);
  const pipeline = useArchitectPipeline(useCaseId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useCase, setUseCase] = useState<UseCase | null>(null);

  useEffect(() => {
    if (!useCaseId) return;
    setLoading(true);
    fetch(`/api/get-usecase-details?useCaseId=${useCaseId}`)
      .then((res) => res.json())
      .then((data) => {
        setUseCase(data.useCase ?? data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load use case");
        setLoading(false);
      });
  }, [useCaseId]);

  // --- State machine rendering ---

  if (loading || architectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Loading&hellip;</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Pipeline running
  if (pipeline.isRunning) {
    return (
      <div className="space-y-4">
        <BackButton />
        <PipelineProgressTracker
          currentStep={pipeline.step}
          error={pipeline.error}
        />
      </div>
    );
  }

  // Pipeline completed
  if (pipeline.step === "completed" && pipeline.output) {
    return (
      <div className="space-y-4">
        <ArchitectOutputDashboard
          output={pipeline.output}
          useCaseId={useCaseId}
          onBack={() => pipeline.reset()}
        />
      </div>
    );
  }

  // Pipeline failed
  if (pipeline.step === "failed") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Assessment Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {pipeline.error || "The architect assessment encountered an error."}
            </p>
            <Button onClick={() => pipeline.reset()} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session-based states
  if (architectSession) {
    const sessionStatus = architectSession.status as string;

    // Completed session
    if (sessionStatus === "completed" && architectSession.architectureOutput) {
      return (
        <div className="space-y-4">
          <ArchitectOutputDashboard
            output={architectSession.architectureOutput as Record<string, unknown>}
            useCaseId={useCaseId}
            onBack={() => router.push("/dashboard")}
          />
        </div>
      );
    }

    // Generating / interpreting
    if (sessionStatus === "interpreting" || sessionStatus === "generating") {
      return (
        <div className="space-y-4">
          <BackButton />
          <PipelineProgressTracker
            currentStep={
              (architectSession.pipelineStep as PipelineStep) || "scoring_pillars"
            }
          />
        </div>
      );
    }

    // Draft — offer to run assessment
    if (sessionStatus === "draft") {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-base">
                {useCase?.title || "Use Case"} — Draft
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This use case has a draft assessment session. You can run the assessment to generate the architecture analysis.
              </p>
              <Button
                onClick={() =>
                  pipeline.generate(
                    (architectSession.pillarInputs as Record<string, unknown>) ?? {}
                  )
                }
                className="w-full"
                disabled={pipeline.isRunning}
              >
                Run Assessment
              </Button>
              <BackButton />
            </CardContent>
          </Card>
        </div>
      );
    }

    // Failed session
    if (sessionStatus === "failed") {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Assessment Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The architect assessment encountered an error. You can retry to generate a new analysis.
              </p>
              <Button
                onClick={() =>
                  pipeline.generate(
                    (architectSession.pillarInputs as Record<string, unknown>) ?? {}
                  )
                }
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Assessment
              </Button>
              <BackButton />
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // No session — empty state
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-base">
            {useCase?.title || "Use Case"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {useCase && (
            <p className="text-sm text-muted-foreground">
              AIUC-{useCase.aiucId} &middot; {useCase.department} &middot; {useCase.owner}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            No architect assessment has been run for this use case yet.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/view-usecase/${useCaseId}`)}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Legacy Data
            </Button>
            <BackButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push("/dashboard")}
      className="text-muted-foreground"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back to Dashboard
    </Button>
  );
}
