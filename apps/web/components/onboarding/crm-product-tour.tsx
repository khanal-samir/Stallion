"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { EventData, Step } from "react-joyride";
import { ACTIONS, EVENTS, Joyride, STATUS } from "react-joyride";
import { useCompleteCrmTour, useOnboardingStatus } from "@/hooks/queries/use-onboarding";

interface RoutedTourStep {
  route: string;
  step: Step;
}

const TOUR_STEPS: RoutedTourStep[] = [
  {
    route: "/dashboard",
    step: {
      target: "[data-tour='dashboard-page']",
      title: "Your workspace dashboard",
      content:
        "Dashboard summarizes the workspace in one place, including contacts, organizations, pipeline activity, win rate, and the deal stages that need attention.",
      placement: "center",
      skipBeacon: true,
    },
  },
  {
    route: "/dashboard",
    step: {
      target: "[data-tour='dashboard-overview']",
      title: "Monitor CRM health",
      content:
        "Review total people, organizations, and deals; compare contacts by lifecycle status; inspect pipeline distribution and focus; and track won-versus-lost performance from the executive snapshot.",
    },
  },
  {
    route: "/people",
    step: {
      target: "[data-tour='people-page']",
      title: "Manage every relationship",
      content:
        "People stores contacts, leads, and customers with ownership, qualification status, source, contact details, linked organizations, and workspace custom fields.",
      placement: "center",
    },
  },
  {
    route: "/people",
    step: {
      target: "[data-tour='people-table']",
      title: "Find and maintain contacts",
      content:
        "Create contacts from the page header, search by identity, filter by status or source, sort the table, open a row to view or edit the complete profile, and select one or more records for safe deletion.",
    },
  },
  {
    route: "/organizations",
    step: {
      target: "[data-tour='organizations-page']",
      title: "Understand every account",
      content:
        "Organizations group company details, ownership, linked contacts, industry, size, location, and custom account fields into a shared workspace record.",
      placement: "center",
    },
  },
  {
    route: "/organizations",
    step: {
      target: "[data-tour='organizations-table']",
      title: "Keep account data organized",
      content:
        "Create accounts from the page header, search and filter the company directory, sort account attributes, open records to update ownership and details, review linked people, and use selection for bulk deletion.",
    },
  },
  {
    route: "/deals",
    step: {
      target: "[data-tour='deals-page']",
      title: "Run your sales pipeline",
      content:
        "Deals connect commercial opportunities to people, organizations, owners, values, close dates, and stages from new through won or lost.",
      placement: "center",
    },
  },
  {
    route: "/deals",
    step: {
      target: "[data-tour='deals-pipeline']",
      title: "Move work forward",
      content:
        "Create opportunities with value, currency, close date, owner, person, and organization. Drag cards between stages to update progress, then open any card to review, edit, or delete the deal.",
      placement: "center",
      isFixed: true,
      floatingOptions: {
        shiftOptions: { padding: 20 },
      },
    },
  },
  {
    route: "/settings/general",
    step: {
      target: "[data-tour='settings-page']",
      title: "Configure the workspace",
      content:
        "Settings controls workspace-wide configuration. Update the workspace profile, manage access, and define the CRM fields your team uses.",
      placement: "center",
    },
  },
  {
    route: "/settings/general",
    step: {
      target: "[data-tour='settings-navigation']",
      title: "Workspace administration",
      content:
        "General controls the workspace name and URL. Custom Fields defines additional People and Organization data. Members manages roles and access, while Invitations tracks pending team invites. You’re ready to use Stallion.",
      placement: "right-start",
      isFixed: true,
      floatingOptions: {
        shiftOptions: { padding: 20 },
      },
    },
  },
];

const JOYRIDE_STEPS = TOUR_STEPS.map(({ step }) => step);

export function CrmProductTour() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: onboardingStatus, isPending: isStatusPending } = useOnboardingStatus();
  const { mutate: completeTour } = useCompleteCrmTour();
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(false);

  const shouldRunTour = onboardingStatus?.crmTourCompleted === false;
  const activeTourStep = TOUR_STEPS[stepIndex];
  const isJoyrideRunning = run && shouldRunTour && pathname === activeTourStep?.route;

  useEffect(() => {
    if (isStatusPending || !shouldRunTour || !activeTourStep) return;

    if (pathname !== activeTourStep.route) {
      router.replace(activeTourStep.route);
      return;
    }

    const timer = window.setTimeout(() => setRun(true), 250);
    return () => window.clearTimeout(timer);
  }, [activeTourStep, isStatusPending, pathname, router, shouldRunTour]);

  function finishTour() {
    setRun(false);
    completeTour();
  }

  function handleJoyrideEvent(event: EventData) {
    if (event.status === STATUS.FINISHED || event.status === STATUS.SKIPPED) {
      finishTour();
      return;
    }

    if (event.type !== EVENTS.STEP_AFTER && event.type !== EVENTS.TARGET_NOT_FOUND) return;

    const nextStepIndex = event.action === ACTIONS.PREV ? stepIndex - 1 : stepIndex + 1;
    if (nextStepIndex < 0 || nextStepIndex >= TOUR_STEPS.length) {
      finishTour();
      return;
    }

    setRun(false);
    setStepIndex(nextStepIndex);
  }

  if (!shouldRunTour) return null;

  return (
    <Joyride
      continuous
      onEvent={handleJoyrideEvent}
      options={{
        arrowColor: "var(--popover)",
        backgroundColor: "var(--popover)",
        buttons: ["back", "skip", "primary"],
        overlayClickAction: false,
        overlayColor: "rgba(15, 23, 42, 0.58)",
        primaryColor: "var(--primary)",
        showProgress: true,
        skipBeacon: true,
        textColor: "var(--popover-foreground)",
        width: 390,
        zIndex: 1000,
      }}
      run={isJoyrideRunning}
      scrollToFirstStep
      stepIndex={stepIndex}
      steps={JOYRIDE_STEPS}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish tour",
        next: "Next",
        open: "Open",
        skip: "Skip tour",
      }}
      styles={{
        tooltip: {
          borderRadius: 12,
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.2)",
          padding: 20,
        },
        tooltipTitle: {
          fontSize: 17,
          fontWeight: 650,
          textAlign: "left",
        },
        tooltipContent: {
          fontSize: 14,
          lineHeight: 1.6,
          padding: "10px 0 16px",
          textAlign: "left",
        },
        buttonPrimary: {
          borderRadius: 7,
          fontSize: 13,
          fontWeight: 600,
          padding: "9px 14px",
        },
        buttonBack: {
          color: "var(--muted-foreground)",
          fontSize: 13,
          marginRight: 8,
        },
        buttonSkip: {
          color: "var(--muted-foreground)",
          fontSize: 13,
        },
      }}
    />
  );
}
