import type { SVGProps } from "react";

// A small, consistent stroke-icon set drawn inline. Icons are decorative by
// default (aria-hidden) — the interactive element around them carries the
// accessible name. Kept local so the app adds no icon dependency and still
// works fully offline.

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function make(path: React.ReactNode, displayName: string) {
  const Component = ({ size = 16, ...props }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {path}
    </svg>
  );
  Component.displayName = displayName;
  return Component;
}

export const IconGauge = make(
  <>
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="m13.4 10.6 4.2-4.2" />
    <path d="M3.5 18a9 9 0 1 1 17 0" />
  </>,
  "IconGauge"
);

export const IconTarget = make(
  <>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </>,
  "IconTarget"
);

export const IconBook = make(
  <>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v4H6.5A2.5 2.5 0 0 1 4 20.5Z" />
  </>,
  "IconBook"
);

export const IconChart = make(
  <>
    <path d="M3 3v18h18" />
    <path d="M7 15v3" />
    <path d="M12 10v8" />
    <path d="M17 6v12" />
  </>,
  "IconChart"
);

export const IconCalendar = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
  "IconCalendar"
);

export const IconAlert = make(
  <>
    <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </>,
  "IconAlert"
);

export const IconSparkle = make(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8.5 13.6 12 12 15.5 10.4 12Z" />
  </>,
  "IconSparkle"
);

export const IconSettings = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </>,
  "IconSettings"
);

export const IconUser = make(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
  "IconUser"
);

export const IconSearch = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
  "IconSearch"
);

export const IconMenu = make(<path d="M4 6h16M4 12h16M4 18h16" />, "IconMenu");
export const IconClose = make(<path d="m6 6 12 12M18 6 6 18" />, "IconClose");
export const IconChevronRight = make(<path d="m9 5 7 7-7 7" />, "IconChevronRight");
export const IconChevronLeft = make(<path d="m15 5-7 7 7 7" />, "IconChevronLeft");
export const IconChevronDown = make(<path d="m5 9 7 7 7-7" />, "IconChevronDown");
export const IconArrowRight = make(<path d="M4 12h15m-6-7 7 7-7 7" />, "IconArrowRight");
export const IconCheck = make(<path d="m4 12.5 5 5L20 6.5" />, "IconCheck");

export const IconCheckCircle = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.5 2.5L16 9.5" />
  </>,
  "IconCheckCircle"
);

export const IconXCircle = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </>,
  "IconXCircle"
);

export const IconFlag = make(
  <>
    <path d="M4 21V4" />
    <path d="M4 4h11l-1.5 3.5L15 11H4Z" />
  </>,
  "IconFlag"
);

export const IconClock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.5l3.5 2" />
  </>,
  "IconClock"
);

export const IconFlame = make(
  <path d="M12 22c3.9 0 6.5-2.6 6.5-6.2 0-4.4-4-6.3-4.8-10.8-1.9 1.4-2.6 3.4-2.3 5.6-1.1-.6-1.8-1.7-2-3.2-2 1.9-3.9 4.5-3.9 8.4C5.5 19.4 8.1 22 12 22Z" />,
  "IconFlame"
);

export const IconTrendUp = make(
  <>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </>,
  "IconTrendUp"
);

export const IconTrendDown = make(
  <>
    <path d="m3 7 6 6 4-4 8 8" />
    <path d="M15 17h6v-6" />
  </>,
  "IconTrendDown"
);

export const IconPlay = make(<path d="M7 4.5v15l13-7.5Z" />, "IconPlay");
export const IconRefresh = make(
  <>
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
    <path d="M3 21v-5h5" />
  </>,
  "IconRefresh"
);

export const IconSun = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
  "IconSun"
);

export const IconMoon = make(
  <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  "IconMoon"
);

export const IconInfo = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>,
  "IconInfo"
);

export const IconList = make(
  <>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2" />
  </>,
  "IconList"
);

export const IconBulb = make(
  <>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
  </>,
  "IconBulb"
);

export const IconMessage = make(
  <path d="M21 12a8 8 0 0 1-8 8H4l1.5-3.5A8 8 0 1 1 21 12Z" />,
  "IconMessage"
);

export const IconFilter = make(
  <path d="M3 5h18l-7 8v6l-4 2v-8Z" />,
  "IconFilter"
);

export const IconLayers = make(
  <>
    <path d="m12 3 9 5-9 5-9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </>,
  "IconLayers"
);

export const IconCalculator = make(
  <>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4" />
  </>,
  "IconCalculator"
);

export const IconNote = make(
  <>
    <path d="M5 3h9l5 5v13H5Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </>,
  "IconNote"
);

export const IconSpinner = ({ size = 16, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
    className="animate-spin"
    {...props}
  >
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);
