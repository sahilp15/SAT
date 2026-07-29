// The single source of truth for navigation. The sidebar, mobile bar, and
// command palette all read from here so a new route can never appear in one
// place and be missing from another.

export interface NavEntry {
  href: string;
  label: string;
  icon: NavIconName;
  /** Shown in the command palette to make search more forgiving. */
  keywords?: string[];
  /** Surfaced in the compact mobile bar. */
  primary?: boolean;
  group: "Study" | "Review" | "Account";
}

export type NavIconName =
  | "gauge"
  | "target"
  | "book"
  | "alert"
  | "calendar"
  | "chart"
  | "sparkle"
  | "layers"
  | "settings"
  | "user";

export const NAV: NavEntry[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "gauge",
    group: "Study",
    primary: true,
    keywords: ["home", "today", "overview", "streak"],
  },
  {
    href: "/diagnostic",
    label: "Score Predictor",
    icon: "target",
    group: "Study",
    keywords: ["diagnostic", "adaptive", "estimate", "baseline", "test"],
  },
  {
    href: "/practice",
    label: "Practice",
    icon: "book",
    group: "Study",
    primary: true,
    keywords: ["questions", "drill", "math", "reading", "writing", "set"],
  },
  {
    href: "/plan",
    label: "Study Plan",
    icon: "calendar",
    group: "Study",
    primary: true,
    keywords: ["schedule", "calendar", "today", "weekly", "goals"],
  },
  {
    href: "/tutor",
    label: "AI Tutor",
    icon: "sparkle",
    group: "Study",
    primary: true,
    keywords: ["chat", "hint", "teach", "explain", "quiz"],
  },
  {
    href: "/errors",
    label: "Error Log",
    icon: "alert",
    group: "Review",
    keywords: ["mistakes", "missed", "wrong", "review", "flagged"],
  },
  {
    href: "/review/spaced-repetition",
    label: "Spaced Review",
    icon: "layers",
    group: "Review",
    keywords: ["srs", "due", "repetition", "recall"],
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: "chart",
    group: "Review",
    keywords: ["progress", "stats", "accuracy", "trend", "mastery"],
  },
  {
    href: "/practice-tests",
    label: "Practice Tests",
    icon: "layers",
    group: "Review",
    keywords: ["full length", "bluebook", "mock"],
  },
  {
    href: "/profile",
    label: "Profile",
    icon: "user",
    group: "Account",
    keywords: ["goals", "availability", "test date", "target"],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: "settings",
    group: "Account",
    keywords: ["preferences", "theme", "ai", "reset", "data"],
  },
];

export const PRIMARY_NAV = NAV.filter((n) => n.primary);

/** Routes that render without the app chrome (their own full-screen layout). */
const BARE_ROUTES = ["/", "/onboarding"];

export function isBareRoute(pathname: string): boolean {
  if (BARE_ROUTES.includes(pathname)) return true;
  // The diagnostic player is a distraction-free testing surface.
  return pathname.startsWith("/diagnostic/run");
}

/** Longest matching nav href, so nested routes light up their parent. */
export function activeHref(pathname: string): string | null {
  let best: string | null = null;
  for (const entry of NAV) {
    if (pathname === entry.href || pathname.startsWith(`${entry.href}/`)) {
      if (!best || entry.href.length > best.length) best = entry.href;
    }
  }
  return best;
}
