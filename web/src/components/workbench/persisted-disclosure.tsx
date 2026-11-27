"use client";

import { type ReactNode } from "react";
import { usePersistedBoolean } from "@/components/workbench/use-persisted-boolean";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { trackUiAction } from "@/lib/analytics";
import type { AnalyticsControlId } from "@/lib/analytics-catalog";

type Props = {
  storageKey: string;
  defaultOpen: boolean;
  summary: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  analyticsId?: AnalyticsControlId;
};

const accordionItemValue = "persisted-disclosure";

export function PersistedDisclosure(props: Props) {
  const [isOpen, setIsOpen] = usePersistedBoolean({
    storageKey: props.storageKey,
    defaultValue: props.defaultOpen,
  });

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? accordionItemValue : ""}
      onValueChange={(value) => {
        setIsOpen(value === accordionItemValue);
        if (props.analyticsId) {
          trackUiAction(props.analyticsId, value === accordionItemValue ? "open" : "close");
        }
      }}
      className={cn("persistedDisclosure", props.className)}
    >
      <AccordionItem value={accordionItemValue} className="border-b-0">
        <AccordionTrigger
          data-analytics-id={props.analyticsId}
          data-analytics-mode="manual"
          className="persistedDisclosureTrigger px-0 py-0 hover:no-underline"
        >
          <span>{props.summary}</span>
        </AccordionTrigger>
        <AccordionContent className={cn("persistedDisclosureContent", props.contentClassName)}>
          {props.children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
