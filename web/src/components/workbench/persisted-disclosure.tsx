"use client";

import { useId, type ReactNode } from "react";
import { usePersistedBoolean } from "@/components/workbench/use-persisted-boolean";

type Props = {
  storageKey: string;
  isdefaultOpen: boolean;
  summary: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function PersistedDisclosure({
  storageKey,
  isdefaultOpen,
  summary,
  children,
  className = "",
  contentClassName = "",
}: Props) {
  const [isOpen, setIsOpen] = usePersistedBoolean({
    storageKey,
    isdefaultValue: isdefaultOpen,
  });
  const contentId = useId();

  return (
    <div className={`persistedDisclosure${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="persistedDisclosureTrigger"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((iscurrentOpen) => !iscurrentOpen)}
      >
        <span>{summary}</span>
        <span className="persistedDisclosureIcon" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen ? (
        <div
          id={contentId}
          className={`persistedDisclosureContent${contentClassName ? ` ${contentClassName}` : ""}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
