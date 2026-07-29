"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { IconClose, IconFilter } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { mistakeLabel } from "@/lib/taxonomy";
import type { ErrorLogFacets } from "@/lib/errorLog";

// Filters are URL state, not component state: a filtered view is shareable,
// survives a refresh, and works with the browser's back button.

const SECTION_LABEL: Record<string, string> = {
  MATH: "Math",
  READING_WRITING: "Reading & Writing",
};

const STATUS_OPTIONS = [
  { value: "UNRESOLVED", label: "Unresolved" },
  { value: "RESOLVED", label: "Understood" },
  { value: "ALL", label: "All" },
];

const ORIGIN_OPTIONS = [
  { value: "ALL", label: "Any source" },
  { value: "DIAGNOSTIC", label: "Diagnostic" },
  { value: "PRACTICE", label: "Practice" },
];

const DATE_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export function ErrorLogFilters({ facets, count }: { facets: ErrorLogFacets; count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const current = useMemo(
    () => ({
      status: params.get("status") ?? "UNRESOLVED",
      section: params.get("section") ?? "",
      domain: params.get("domain") ?? "",
      skill: params.get("skill") ?? "",
      category: params.get("category") ?? "",
      difficulty: params.get("difficulty") ?? "",
      origin: params.get("origin") ?? "ALL",
      days: params.get("days") ?? "",
    }),
    [params]
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "ALL_DEFAULT") next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  const activeCount = [
    current.section,
    current.domain,
    current.skill,
    current.category,
    current.difficulty,
    current.days,
    current.origin !== "ALL" ? current.origin : "",
    current.status !== "UNRESOLVED" ? current.status : "",
  ].filter(Boolean).length;

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-line bg-surface-2 p-1">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setParam("status", o.value === "UNRESOLVED" ? "" : o.value)}
              aria-pressed={current.status === o.value}
              className={cx(
                "rounded-[0.4375rem] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                current.status === o.value
                  ? "bg-surface text-ink shadow-xs"
                  : "text-ink-3 hover:text-ink"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <span className="font-mono text-[0.75rem] text-ink-3">
          {count} {count === 1 ? "entry" : "entries"}
        </span>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cx("btn btn-sm ml-auto", activeCount ? "btn-primary" : "btn-secondary")}
        >
          <IconFilter size={14} />
          Filters
          {activeCount ? (
            <span className="rounded-full bg-[rgb(255_255_255/0.25)] px-1.5 font-mono text-[0.625rem]">
              {activeCount}
            </span>
          ) : null}
        </button>

        {activeCount ? (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="btn btn-ghost btn-sm"
          >
            <IconClose size={13} />
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-4 grid grid-cols-1 animate-fade-in gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Section"
            value={current.section}
            onChange={(v) => setParam("section", v)}
            options={[
              { value: "", label: "All sections" },
              ...facets.sections.map((s) => ({ value: s, label: SECTION_LABEL[s] ?? s })),
            ]}
          />
          <Select
            label="Content domain"
            value={current.domain}
            onChange={(v) => setParam("domain", v)}
            options={[
              { value: "", label: "All domains" },
              ...facets.domains.map((d) => ({ value: d, label: d })),
            ]}
          />
          <Select
            label="Skill"
            value={current.skill}
            onChange={(v) => setParam("skill", v)}
            options={[
              { value: "", label: "All skills" },
              ...facets.skills.map((s) => ({ value: s, label: s })),
            ]}
          />
          <Select
            label="Mistake type"
            value={current.category}
            onChange={(v) => setParam("category", v)}
            options={[
              { value: "", label: "All mistake types" },
              ...facets.categories.map((c) => ({ value: c, label: mistakeLabel(c) })),
            ]}
          />
          <Select
            label="Difficulty"
            value={current.difficulty}
            onChange={(v) => setParam("difficulty", v)}
            options={[
              { value: "", label: "Any difficulty" },
              ...facets.difficulties.map((d) => ({
                value: d,
                label: d.charAt(0) + d.slice(1).toLowerCase(),
              })),
            ]}
          />
          <Select
            label="Source"
            value={current.origin}
            onChange={(v) => setParam("origin", v === "ALL" ? "" : v)}
            options={ORIGIN_OPTIONS}
          />
          <Select
            label="Date"
            value={current.days}
            onChange={(v) => setParam("days", v)}
            options={DATE_OPTIONS}
          />
        </div>
      ) : null}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
