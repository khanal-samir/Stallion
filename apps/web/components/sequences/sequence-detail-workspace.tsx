"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Linkedin,
  Mail,
  Pause,
  Play,
  Save,
  Send,
  Sparkles,
  SquareCheck,
  Trash2,
  UserPlus,
  Workflow,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import { Checkbox } from "@workspace/ui/components/ui/checkbox";
import { Input } from "@workspace/ui/components/ui/input";
import { Label } from "@workspace/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/ui/tabs";
import { Textarea } from "@workspace/ui/components/ui/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { SequenceStatusBadge } from "@/components/sequences/sequence-status-badge";
import { usePeople } from "@/hooks/queries/use-people";
import {
  useCompleteSequenceTask,
  useEnrollPeople,
  useGenerateEmailContent,
  useGmailIntegrations,
  usePauseEnrollment,
  usePublishSequence,
  useResumeEnrollment,
  useSequence,
  useSequenceActivity,
  useSequenceDashboard,
  useSequenceEnrollments,
  useUpdateSequence,
} from "@/hooks/queries/use-sequences";
import type {
  SequenceActivityEvent,
  SequenceEnrollment,
  SequenceStep,
  SequenceTask,
} from "@/types/sequence";
import type {
  SequenceDraftStepInput,
  SequenceStepType,
} from "@workspace/validators/schemas/sequence";

const STEP_OPTIONS: Array<{
  type: SequenceStepType;
  label: string;
  icon: React.ElementType;
  config: Record<string, unknown>;
}> = [
  { type: "email", label: "Email", icon: Mail, config: { prompt: "", subject: "", body: "" } },
  { type: "wait", label: "Wait", icon: Clock, config: { days: 1 } },
  {
    type: "linkedin_task",
    label: "LinkedIn",
    icon: Linkedin,
    config: { prompt: "", title: "LinkedIn follow-up", body: "" },
  },
  {
    type: "general_task",
    label: "Task",
    icon: SquareCheck,
    config: { prompt: "", title: "Manual follow-up", body: "" },
  },
];

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function toDraftStep(step: SequenceStep): SequenceDraftStepInput {
  return {
    id: step.id,
    type: step.type,
    name: step.name,
    position: step.position,
    config: step.config,
  };
}

function StepIcon({ type, className }: { type: SequenceStepType; className?: string }) {
  const option = STEP_OPTIONS.find((step) => step.type === type);
  const Icon = option?.icon ?? Workflow;
  return <Icon className={cn("size-4", className)} />;
}

function StepPalette({ onAdd }: { onAdd: (type: SequenceStepType) => void }) {
  return (
    <div className="rounded-lg border border-border/80 bg-card p-3">
      <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Steps</p>
      <div className="grid gap-2">
        {STEP_OPTIONS.map((option) => (
          <Button
            key={option.type}
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => onAdd(option.type)}
          >
            <option.icon className="size-4" />
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function FlowCanvas({
  steps,
  selectedStepId,
  onSelect,
  onRemove,
}: {
  steps: SequenceDraftStepInput[];
  selectedStepId: string | null;
  onSelect: (stepId: string) => void;
  onRemove: (stepId: string) => void;
}) {
  if (steps.length === 0) {
    return (
      <div className="flex min-h-[22rem] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
        <EmptyState
          icon={Workflow}
          title="No steps"
          description="Add a step from the palette to start the flow."
        />
      </div>
    );
  }

  return (
    <div className="min-h-[22rem] rounded-lg border border-border/80 bg-background p-5">
      <div className="flex flex-col items-center gap-3">
        {steps.map((step, index) => {
          const isSelected = step.id === selectedStepId;
          return (
            <div key={step.id} className="flex w-full max-w-xl flex-col items-center gap-3">
              <button
                type="button"
                className={cn(
                  "group flex w-full items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 text-left shadow-sm transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/15"
                    : "border-border/80 hover:border-primary/40",
                )}
                onClick={() => onSelect(step.id!)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <StepIcon type={step.type} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{step.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {step.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(step.id!);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </button>
              {index < steps.length - 1 && <div className="h-8 w-px bg-border" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepInspector({
  step,
  onChange,
  onGenerateEmail,
  generating,
}: {
  step?: SequenceDraftStepInput;
  onChange: (step: SequenceDraftStepInput) => void;
  onGenerateEmail: (step: SequenceDraftStepInput) => void;
  generating: boolean;
}) {
  if (!step) {
    return (
      <div className="rounded-lg border border-border/80 bg-card p-4">
        <p className="text-sm text-muted-foreground">Select a step to edit.</p>
      </div>
    );
  }

  function updateConfig(config: Record<string, unknown>) {
    onChange({ ...step!, config: { ...step!.config, ...config } });
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <StepIcon type={step.type} className="text-primary" />
        <h2 className="text-sm font-semibold">Inspector</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="step-name">Name</Label>
          <Input
            id="step-name"
            value={step.name}
            onChange={(event) => onChange({ ...step, name: event.target.value })}
          />
        </div>

        {step.type === "email" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="email-prompt">AI prompt</Label>
              <Textarea
                id="email-prompt"
                value={asString(step.config.prompt)}
                onChange={(event) => updateConfig({ prompt: event.target.value })}
                rows={4}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={generating || !asString(step.config.prompt)}
              onClick={() => onGenerateEmail(step)}
            >
              <Sparkles className="size-4" />
              Generate
            </Button>
            <div className="space-y-1.5">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={asString(step.config.subject)}
                onChange={(event) => updateConfig({ subject: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-body">Body</Label>
              <Textarea
                id="email-body"
                value={asString(step.config.body)}
                onChange={(event) => updateConfig({ body: event.target.value })}
                rows={8}
              />
            </div>
          </>
        )}

        {step.type === "wait" && (
          <div className="space-y-1.5">
            <Label htmlFor="wait-days">Calendar days</Label>
            <Input
              id="wait-days"
              type="number"
              min={0}
              max={365}
              value={asNumber(step.config.days, 1)}
              onChange={(event) => updateConfig({ days: Number(event.target.value) })}
            />
          </div>
        )}

        {(step.type === "linkedin_task" || step.type === "general_task") && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={asString(step.config.title)}
                onChange={(event) => updateConfig({ title: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-prompt">AI prompt</Label>
              <Textarea
                id="task-prompt"
                value={asString(step.config.prompt)}
                onChange={(event) => updateConfig({ prompt: event.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-body">Body</Label>
              <Textarea
                id="task-body"
                value={asString(step.config.body)}
                onChange={(event) => updateConfig({ body: event.target.value })}
                rows={6}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BuilderEditor({
  sequenceId,
  initialName,
  initialSteps,
}: {
  sequenceId: string;
  initialName: string;
  initialSteps: SequenceDraftStepInput[];
}) {
  const updateMutation = useUpdateSequence(sequenceId);
  const publishMutation = usePublishSequence(sequenceId);
  const generateMutation = useGenerateEmailContent();
  const [name, setName] = useState(initialName);
  const [steps, setSteps] = useState<SequenceDraftStepInput[]>(initialSteps);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(initialSteps[0]?.id ?? null);

  const sortedSteps = useMemo(() => [...steps].sort((a, b) => a.position - b.position), [steps]);
  const selectedStep = sortedSteps.find((step) => step.id === selectedStepId);

  function addStep(type: SequenceStepType) {
    const option = STEP_OPTIONS.find((item) => item.type === type)!;
    const step: SequenceDraftStepInput = {
      id: crypto.randomUUID(),
      type,
      name: option.label,
      position: sortedSteps.length,
      config: option.config,
    };
    setSteps([...sortedSteps, step]);
    setSelectedStepId(step.id!);
  }

  function updateStep(nextStep: SequenceDraftStepInput) {
    setSteps((current) => current.map((step) => (step.id === nextStep.id ? nextStep : step)));
  }

  function removeStep(stepId: string) {
    const nextSteps = sortedSteps
      .filter((step) => step.id !== stepId)
      .map((step, position) => ({ ...step, position }));
    setSteps(nextSteps);
    setSelectedStepId(nextSteps[0]?.id ?? null);
  }

  function saveDraft() {
    updateMutation.mutate({
      name,
      steps: sortedSteps.map((step, position) => ({ ...step, position })),
    });
  }

  function generateForStep(step: SequenceDraftStepInput) {
    generateMutation.mutate(asString(step.config.prompt), {
      onSuccess: (email) => updateStep({ ...step, config: { ...step.config, ...email } }),
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[14rem_minmax(0,1fr)_22rem]">
      <StepPalette onAdd={addStep} />
      <div className="space-y-4">
        <div className="rounded-lg border border-border/80 bg-card p-4">
          <Label htmlFor="sequence-name">Sequence name</Label>
          <Input
            id="sequence-name"
            className="mt-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <FlowCanvas
          steps={sortedSteps}
          selectedStepId={selectedStepId}
          onSelect={setSelectedStepId}
          onRemove={removeStep}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={updateMutation.isPending} onClick={saveDraft}>
            <Save className="size-4" />
            Save draft
          </Button>
          <Button disabled={publishMutation.isPending} onClick={() => publishMutation.mutate()}>
            <Send className="size-4" />
            Publish
          </Button>
        </div>
      </div>
      <StepInspector
        step={selectedStep}
        onChange={updateStep}
        onGenerateEmail={generateForStep}
        generating={generateMutation.isPending}
      />
    </div>
  );
}

function BuilderTab({ sequenceId }: { sequenceId: string }) {
  const { data, isLoading } = useSequence(sequenceId);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!data?.sequence) {
    return (
      <EmptyState
        icon={Workflow}
        title="Sequence not found"
        description="The selected sequence is no longer available."
      />
    );
  }

  return (
    <BuilderEditor
      key={`${data.sequence.id}:${data.sequence.updatedAt}`}
      sequenceId={sequenceId}
      initialName={data.sequence.name}
      initialSteps={(data.sequence.steps ?? []).map(toDraftStep)}
    />
  );
}

function EnrollmentRow({
  enrollment,
  onPause,
  onResume,
}: {
  enrollment: SequenceEnrollment;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{enrollment.person?.name ?? "Unknown person"}</p>
          <Badge variant="outline" className="capitalize">
            {enrollment.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {enrollment.person?.email ?? "No email"} ·{" "}
          {enrollment.nextStepDueAt
            ? `Next ${new Date(enrollment.nextStepDueAt).toLocaleString()}`
            : "No due step"}
        </p>
      </div>
      <div className="flex gap-2">
        {enrollment.status === "paused" ? (
          <Button variant="outline" size="sm" onClick={() => onResume(enrollment.id)}>
            <Play className="size-4" />
            Resume
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => onPause(enrollment.id)}>
            <Pause className="size-4" />
            Pause
          </Button>
        )}
      </div>
    </div>
  );
}

function EnrollmentsTab({ sequenceId }: { sequenceId: string }) {
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [gmailIntegrationId, setGmailIntegrationId] = useState("");
  const { data: peopleData, isLoading: peopleLoading } = usePeople({ pageSize: 50 });
  const { data: gmailIntegrations } = useGmailIntegrations();
  const { data: enrollments, isLoading: enrollmentsLoading } = useSequenceEnrollments(sequenceId);
  const enrollMutation = useEnrollPeople(sequenceId);
  const pauseMutation = usePauseEnrollment();
  const resumeMutation = useResumeEnrollment();

  function togglePerson(personId: string, checked: boolean) {
    setSelectedPeople((current) =>
      checked ? [...current, personId] : current.filter((id) => id !== personId),
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-3">
        {enrollmentsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : enrollments?.length ? (
          enrollments.map((enrollment) => (
            <EnrollmentRow
              key={enrollment.id}
              enrollment={enrollment}
              onPause={(id) => pauseMutation.mutate(id)}
              onResume={(id) => resumeMutation.mutate(id)}
            />
          ))
        ) : (
          <EmptyState
            icon={UserPlus}
            title="No enrollments"
            description="Enroll people into the latest published version."
          />
        )}
      </div>

      <div className="rounded-lg border border-border/80 bg-card p-4">
        <h2 className="text-sm font-semibold">Enroll people</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Gmail sender</Label>
            <Select value={gmailIntegrationId} onValueChange={setGmailIntegrationId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sender" />
              </SelectTrigger>
              <SelectContent>
                {(gmailIntegrations ?? []).map((integration) => (
                  <SelectItem key={integration.id} value={integration.id}>
                    {integration.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {peopleLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              (peopleData?.people ?? []).map((person) => (
                <label
                  key={person.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border/70 p-3"
                >
                  <Checkbox
                    checked={selectedPeople.includes(person.id)}
                    onCheckedChange={(checked) => togglePerson(person.id, checked === true)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{person.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {person.email ?? "No email"}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>

          <Button
            className="w-full"
            disabled={selectedPeople.length === 0 || enrollMutation.isPending}
            onClick={() =>
              enrollMutation.mutate({
                personIds: selectedPeople,
                gmailIntegrationId: gmailIntegrationId || undefined,
              })
            }
          >
            <UserPlus className="size-4" />
            Enroll selected
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ event }: { event: SequenceActivityEvent }) {
  return (
    <div className="rounded-lg border border-border/80 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline" className="capitalize">
          {event.type.replaceAll("_", " ")}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(event.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-2 text-sm">{event.message}</p>
    </div>
  );
}

function ActivityTab({ sequenceId }: { sequenceId: string }) {
  const { data: activity, isLoading } = useSequenceActivity(sequenceId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!activity?.length) {
    return (
      <EmptyState
        icon={Workflow}
        title="No activity"
        description="Sequence events will appear after publishing, enrollment, sends, replies, and tasks."
      />
    );
  }

  return (
    <div className="space-y-3">
      {activity.map((event) => (
        <ActivityItem key={event.id} event={event} />
      ))}
    </div>
  );
}

function DashboardTasks() {
  const { data } = useSequenceDashboard();
  const completeTaskMutation = useCompleteSequenceTask();
  const tasks = (data?.dueTasks ?? []).slice(0, 5);

  if (tasks.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Due sequence tasks</h2>
      <div className="space-y-2">
        {tasks.map((task: SequenceTask) => (
          <div key={task.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{task.title}</p>
              <p className="truncate text-xs text-muted-foreground">{task.person?.name ?? task.type}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={completeTaskMutation.isPending}
              onClick={() => completeTaskMutation.mutate(task.id)}
            >
              <Check className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SequenceDetailWorkspace({ sequenceId }: { sequenceId: string }) {
  const { data, isLoading, isError, refetch } = useSequence(sequenceId);

  if (isLoading) return <LoadingState variant="page" text="Loading sequence..." />;
  if (isError) return <ErrorState title="Unable to load sequence" onRetry={() => refetch()} />;
  if (!data?.sequence) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.sequence.name}
        description="Builder, enrollments, and sequence activity."
        count={data.counts.enrollments}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/sequences">
                <ArrowLeft className="size-4" />
                Sequences
              </Link>
            </Button>
            <SequenceStatusBadge status={data.sequence.status} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/80 bg-card p-4">
          <p className="text-xs text-muted-foreground">Draft steps</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {(data.sequence.steps ?? []).length}
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card p-4">
          <p className="text-xs text-muted-foreground">Enrollments</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{data.counts.enrollments}</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card p-4">
          <p className="text-xs text-muted-foreground">Activity events</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{data.counts.activity}</p>
        </div>
      </div>

      <DashboardTasks />

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="builder">
          <BuilderTab sequenceId={sequenceId} />
        </TabsContent>
        <TabsContent value="enrollments">
          <EnrollmentsTab sequenceId={sequenceId} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab sequenceId={sequenceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
