// ── UI-specific CRM types & mock data ────────────────────────────────

// ── People ───────────────────────────────────────────────────────────
export type PersonStatus = "lead" | "prospect" | "qualified" | "customer" | "churned";

export type PersonSource = "manual" | "csv" | "api";

export interface Person {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  orgId?: string;
  orgName?: string;
  ownerId?: string;
  ownerName?: string;
  ownerInitials?: string;
  status: PersonStatus;
  source: PersonSource;
  lastContactedAt?: string;
  createdAt: string;
}

// ── Organizations ────────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  location?: string;
  peopleCount: number;
}

// ── Deals ────────────────────────────────────────────────────────────
export type DealStage = "New" | "Contacted" | "Demo" | "Proposal" | "Won" | "Lost";

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  personName?: string;
  orgName?: string;
  ownerName: string;
  ownerInitials: string;
  closeDate: string;
  daysInStage: number;
  createdAt: string;
}

// ── Sequences ────────────────────────────────────────────────────────
export type SequenceStatus = "draft" | "active" | "archived";

export interface Sequence {
  id: string;
  name: string;
  status: SequenceStatus;
  enrolled: number;
  openRate: number;
  replyRate: number;
  steps: number;
  channels: string;
  schedule: string;
  ownerName: string;
  ownerInitials: string;
  createdAt: string;
}

// ── Activity ─────────────────────────────────────────────────────────
export type ActivityType = "email" | "call" | "note" | "deal" | "task";

export interface Activity {
  id: string;
  type: ActivityType;
  personName: string;
  personInitials: string;
  description: string;
  timestamp: string;
}

// ── Tasks ────────────────────────────────────────────────────────────
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  personName: string;
  priority: TaskPriority;
  dueTime: string;
}

// ── Dashboard Stats ──────────────────────────────────────────────────
export interface StatCard {
  label: string;
  value: string | number;
  delta: number;
  deltaLabel: string;
}

// ── Pipeline Stage ───────────────────────────────────────────────────
export interface PipelineStage {
  name: DealStage;
  count: number;
  value: number;
  percentage: number;
}

// ══════════════════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════════════════

export const MOCK_PEOPLE: Person[] = [
  {
    id: "p1",
    name: "Sarah Chen",
    email: "sarah@acmecorp.com",
    phone: "+1 (555) 234-5678",
    jobTitle: "VP of Sales",
    orgId: "o1",
    orgName: "Acme Corp",
    ownerId: "u1",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    status: "qualified",
    source: "manual",
    lastContactedAt: "2026-03-02T10:30:00Z",
    createdAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "p2",
    name: "James Wilson",
    email: "james@techflow.io",
    jobTitle: "CTO",
    orgId: "o2",
    orgName: "TechFlow",
    ownerId: "u1",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    status: "prospect",
    source: "csv",
    lastContactedAt: "2026-02-28T14:00:00Z",
    createdAt: "2026-02-01T11:00:00Z",
  },
  {
    id: "p3",
    name: "Maria Garcia",
    email: "maria@designhub.co",
    jobTitle: "Head of Product",
    orgId: "o3",
    orgName: "DesignHub",
    ownerId: "u2",
    ownerName: "Jordan Lee",
    ownerInitials: "JL",
    status: "lead",
    source: "api",
    lastContactedAt: "2026-02-10T08:00:00Z",
    createdAt: "2026-02-05T16:30:00Z",
  },
  {
    id: "p4",
    name: "David Park",
    email: "david@cloudnine.dev",
    jobTitle: "Engineering Manager",
    orgId: "o4",
    orgName: "CloudNine",
    ownerId: "u2",
    ownerName: "Jordan Lee",
    ownerInitials: "JL",
    status: "customer",
    source: "manual",
    lastContactedAt: "2026-03-03T16:00:00Z",
    createdAt: "2025-11-20T10:00:00Z",
  },
  {
    id: "p5",
    name: "Emily Zhang",
    email: "emily@startupxyz.com",
    jobTitle: "CEO",
    orgId: "o5",
    orgName: "StartupXYZ",
    ownerId: "u1",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    status: "churned",
    source: "csv",
    lastContactedAt: "2026-01-05T12:00:00Z",
    createdAt: "2025-10-01T09:00:00Z",
  },
  {
    id: "p6",
    name: "Ryan Mitchell",
    email: "ryan@bluewavetech.com",
    jobTitle: "Director of Operations",
    orgId: "o6",
    orgName: "BlueWave Tech",
    ownerId: "u1",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    status: "prospect",
    source: "manual",
    lastContactedAt: "2026-03-01T09:00:00Z",
    createdAt: "2026-02-20T14:00:00Z",
  },
  {
    id: "p7",
    name: "Lisa Thompson",
    email: "lisa@greenfield.io",
    jobTitle: "Marketing Lead",
    orgId: "o7",
    orgName: "Greenfield Analytics",
    ownerId: "u2",
    ownerName: "Jordan Lee",
    ownerInitials: "JL",
    status: "qualified",
    source: "api",
    lastContactedAt: "2026-03-03T11:30:00Z",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "p8",
    name: "Tom Baker",
    email: "tom@nexusco.com",
    jobTitle: "Sales Manager",
    orgId: "o8",
    orgName: "Nexus Co",
    ownerId: "u1",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    status: "lead",
    source: "csv",
    createdAt: "2026-03-01T10:00:00Z",
  },
];

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "o1",
    name: "Acme Corp",
    domain: "acmecorp.com",
    industry: "Technology",
    size: "51-200",
    location: "San Francisco, CA",
    peopleCount: 12,
  },
  {
    id: "o2",
    name: "TechFlow",
    domain: "techflow.io",
    industry: "Software",
    size: "11-50",
    location: "New York, NY",
    peopleCount: 8,
  },
  {
    id: "o3",
    name: "DesignHub",
    domain: "designhub.co",
    industry: "Design",
    size: "1-10",
    location: "Austin, TX",
    peopleCount: 5,
  },
  {
    id: "o4",
    name: "CloudNine",
    domain: "cloudnine.dev",
    industry: "Cloud Computing",
    size: "201-500",
    location: "Seattle, WA",
    peopleCount: 15,
  },
  {
    id: "o5",
    name: "StartupXYZ",
    domain: "startupxyz.com",
    industry: "Technology",
    size: "1-10",
    location: "Boston, MA",
    peopleCount: 3,
  },
  {
    id: "o6",
    name: "BlueWave Tech",
    domain: "bluewavetech.com",
    industry: "Software",
    size: "51-200",
    location: "Chicago, IL",
    peopleCount: 9,
  },
  {
    id: "o7",
    name: "Greenfield Analytics",
    domain: "greenfield.io",
    industry: "Data Analytics",
    size: "11-50",
    location: "Denver, CO",
    peopleCount: 7,
  },
  {
    id: "o8",
    name: "Nexus Co",
    domain: "nexusco.com",
    industry: "Consulting",
    size: "201-500",
    location: "Miami, FL",
    peopleCount: 18,
  },
];

export const MOCK_DEALS: Deal[] = [
  {
    id: "d1",
    title: "Acme Corp Enterprise",
    value: 48000,
    currency: "USD",
    stage: "Proposal",
    personName: "Sarah Chen",
    orgName: "Acme Corp",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    closeDate: "2026-03-15",
    daysInStage: 5,
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "d2",
    title: "TechFlow Platform",
    value: 32000,
    currency: "USD",
    stage: "Demo",
    personName: "James Wilson",
    orgName: "TechFlow",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    closeDate: "2026-03-20",
    daysInStage: 3,
    createdAt: "2026-02-10T09:00:00Z",
  },
  {
    id: "d3",
    title: "DesignHub Pro",
    value: 15000,
    currency: "USD",
    stage: "Contacted",
    personName: "Maria Garcia",
    orgName: "DesignHub",
    ownerName: "Jordan Lee",
    ownerInitials: "JL",
    closeDate: "2026-04-01",
    daysInStage: 8,
    createdAt: "2026-02-15T11:00:00Z",
  },
  {
    id: "d4",
    title: "CloudNine Migration",
    value: 72000,
    currency: "USD",
    stage: "Won",
    personName: "David Park",
    orgName: "CloudNine",
    ownerName: "Jordan Lee",
    ownerInitials: "JL",
    closeDate: "2026-02-28",
    daysInStage: 0,
    createdAt: "2025-12-01T09:00:00Z",
  },
  {
    id: "d5",
    title: "StartupXYZ Starter",
    value: 8000,
    currency: "USD",
    stage: "Lost",
    personName: "Emily Zhang",
    orgName: "StartupXYZ",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    closeDate: "2026-02-15",
    daysInStage: 0,
    createdAt: "2026-01-05T10:00:00Z",
  },
  {
    id: "d6",
    title: "BlueWave Analytics Suite",
    value: 24000,
    currency: "USD",
    stage: "New",
    personName: "Ryan Mitchell",
    orgName: "BlueWave Tech",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    closeDate: "2026-04-15",
    daysInStage: 2,
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "d7",
    title: "Greenfield Dashboard",
    value: 19500,
    currency: "USD",
    stage: "Demo",
    personName: "Lisa Thompson",
    orgName: "Greenfield Analytics",
    ownerName: "Jordan Lee",
    ownerInitials: "JL",
    closeDate: "2026-03-25",
    daysInStage: 4,
    createdAt: "2026-02-20T08:00:00Z",
  },
  {
    id: "d8",
    title: "Nexus Onboarding",
    value: 12000,
    currency: "USD",
    stage: "New",
    personName: "Tom Baker",
    orgName: "Nexus Co",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    closeDate: "2026-04-20",
    daysInStage: 1,
    createdAt: "2026-03-02T14:00:00Z",
  },
  {
    id: "d9",
    title: "Acme Corp Add-On",
    value: 16000,
    currency: "USD",
    stage: "Contacted",
    personName: "Sarah Chen",
    orgName: "Acme Corp",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    closeDate: "2026-03-30",
    daysInStage: 6,
    createdAt: "2026-02-22T10:00:00Z",
  },
];

export const MOCK_SEQUENCES: Sequence[] = [
  {
    id: "s1",
    name: "Enterprise Outreach Q1",
    status: "active",
    enrolled: 142,
    openRate: 68,
    replyRate: 12,
    steps: 5,
    channels: "Email + LinkedIn",
    schedule: "Mon-Fri, 9am-5pm EST",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "s2",
    name: "SMB Re-engagement",
    status: "active",
    enrolled: 89,
    openRate: 54,
    replyRate: 8,
    steps: 4,
    channels: "Email",
    schedule: "Mon-Thu, 10am-4pm EST",
    ownerName: "Jordan Lee",
    ownerInitials: "JL",
    createdAt: "2026-02-01T11:00:00Z",
  },
  {
    id: "s3",
    name: "Product Launch Follow-up",
    status: "draft",
    enrolled: 0,
    openRate: 0,
    replyRate: 0,
    steps: 6,
    channels: "Email + LinkedIn + Call",
    schedule: "Mon-Fri, 8am-6pm EST",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "s4",
    name: "Churn Prevention",
    status: "archived",
    enrolled: 234,
    openRate: 72,
    replyRate: 15,
    steps: 3,
    channels: "Email",
    schedule: "Mon-Fri, 9am-12pm EST",
    ownerName: "Jordan Lee",
    ownerInitials: "JL",
    createdAt: "2025-11-15T14:00:00Z",
  },
  {
    id: "s5",
    name: "Demo Booker",
    status: "active",
    enrolled: 67,
    openRate: 61,
    replyRate: 18,
    steps: 4,
    channels: "Email + LinkedIn",
    schedule: "Tue-Fri, 9am-3pm EST",
    ownerName: "Alex Kim",
    ownerInitials: "AK",
    createdAt: "2026-02-15T09:00:00Z",
  },
  {
    id: "s6",
    name: "Conference Follow-up 2026",
    status: "draft",
    enrolled: 0,
    openRate: 0,
    replyRate: 0,
    steps: 3,
    channels: "Email",
    schedule: "Mon-Wed, 10am-2pm EST",
    ownerName: "Jordan Lee",
    ownerInitials: "JL",
    createdAt: "2026-03-03T16:00:00Z",
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "a1",
    type: "email",
    personName: "Alex Kim",
    personInitials: "AK",
    description: 'Sent "Q1 Enterprise Proposal" to Sarah Chen',
    timestamp: "2 min ago",
  },
  {
    id: "a2",
    type: "deal",
    personName: "Jordan Lee",
    personInitials: "JL",
    description: "Moved CloudNine Migration to Won ($72,000)",
    timestamp: "15 min ago",
  },
  {
    id: "a3",
    type: "call",
    personName: "Alex Kim",
    personInitials: "AK",
    description: "Completed call with James Wilson (12 min)",
    timestamp: "1 hr ago",
  },
  {
    id: "a4",
    type: "note",
    personName: "Jordan Lee",
    personInitials: "JL",
    description: 'Added note on Maria Garcia: "Interested in Pro plan"',
    timestamp: "2 hr ago",
  },
  {
    id: "a5",
    type: "task",
    personName: "Alex Kim",
    personInitials: "AK",
    description: "Completed task: Follow up with Ryan Mitchell",
    timestamp: "3 hr ago",
  },
  {
    id: "a6",
    type: "email",
    personName: "Jordan Lee",
    personInitials: "JL",
    description: 'Sent "Case Study" to Lisa Thompson',
    timestamp: "4 hr ago",
  },
  {
    id: "a7",
    type: "deal",
    personName: "Alex Kim",
    personInitials: "AK",
    description: "Created deal: Nexus Onboarding ($12,000)",
    timestamp: "5 hr ago",
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    title: "Follow up with Sarah Chen",
    personName: "Sarah Chen",
    priority: "high",
    dueTime: "10:00 AM",
  },
  {
    id: "t2",
    title: "Send proposal to James Wilson",
    personName: "James Wilson",
    priority: "high",
    dueTime: "11:30 AM",
  },
  {
    id: "t3",
    title: "Review Greenfield contract",
    personName: "Lisa Thompson",
    priority: "medium",
    dueTime: "2:00 PM",
  },
  {
    id: "t4",
    title: "Update CRM notes for BlueWave",
    personName: "Ryan Mitchell",
    priority: "low",
    dueTime: "4:00 PM",
  },
];

export const MOCK_PIPELINE: PipelineStage[] = [
  { name: "New", count: 2, value: 36000, percentage: 15 },
  { name: "Contacted", count: 2, value: 31000, percentage: 20 },
  { name: "Demo", count: 2, value: 51500, percentage: 25 },
  { name: "Proposal", count: 1, value: 48000, percentage: 20 },
  { name: "Won", count: 1, value: 72000, percentage: 15 },
  { name: "Lost", count: 1, value: 8000, percentage: 5 },
];

export const MOCK_EMAIL_CHART = [
  { day: "Mon", sent: 42, opened: 28, replied: 6 },
  { day: "Tue", sent: 38, opened: 25, replied: 8 },
  { day: "Wed", sent: 55, opened: 38, replied: 11 },
  { day: "Thu", sent: 47, opened: 30, replied: 7 },
  { day: "Fri", sent: 51, opened: 35, replied: 9 },
  { day: "Sat", sent: 12, opened: 8, replied: 2 },
  { day: "Sun", sent: 8, opened: 5, replied: 1 },
];

export const MOCK_LEADS_BY_SOURCE = [
  { name: "LinkedIn", value: 45 },
  { name: "Website", value: 32 },
  { name: "Referral", value: 28 },
  { name: "Cold Email", value: 18 },
];

export const DEAL_STAGES: DealStage[] = ["New", "Contacted", "Demo", "Proposal", "Won", "Lost"];
