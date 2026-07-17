'use client';

import React, { useState, useRef, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CalendarViewType } from '@/types/event';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useEventCalendarStore } from '@/hooks/use-event';

interface CalendarTabsProps {
  viewType: CalendarViewType;
  onChange: (viewType: CalendarViewType) => void;
  className?: string;
  disabledViews?: CalendarViewType[];
}

type TabConfig = {
  label: string;
  value: CalendarViewType;
  hasDropdown?: boolean;
};

const tabsConfig: TabConfig[] = [
  {
    label: 'Day',
    value: CalendarViewType.DAY,
  },
  {
    label: 'Days',
    value: CalendarViewType.DAYS,
    hasDropdown: true,
  },
  {
    label: 'Week',
    value: CalendarViewType.WEEK,
  },
  {
    label: 'Month',
    value: CalendarViewType.MONTH,
  },
  {
    label: 'Year',
    value: CalendarViewType.YEAR,
  },
];

const daysOptions = [3, 5, 7, 10, 14, 31];

const transition = {
  duration: 0.15,
};

const getHoverAnimationProps = (hoveredRect: DOMRect, navRect: DOMRect) => ({
  x: hoveredRect.left - navRect.left - 10,
  y: hoveredRect.top - navRect.top - 4,
  width: hoveredRect.width + 20,
  height: hoveredRect.height + 8,
});

export function EventCalendarTabs({
  viewType,
  onChange,
  className = '',
  disabledViews = [],
}: CalendarTabsProps) {
  const desktopButtonRefs = useRef<(HTMLButtonElement | null)[]>(
    new Array(tabsConfig.length).fill(null),
  );
  const navRef = useRef<HTMLDivElement>(null);

  const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const { daysCount: storeDaysCount, setDaysCount: setStoreDaysCount } =
    useEventCalendarStore();
  const [, setQueryDaysCount] = useQueryState(
    'daysCount',
    parseAsInteger.withDefault(7).withOptions({
      shallow: false,
      throttleMs: 3,
      startTransition,
    }),
  );
  const [, setView] = useQueryState(
    'view',
    parseAsString.withOptions({
      shallow: false,
      throttleMs: 3,
      startTransition,
    }),
  );

  const visibleTabs = tabsConfig.filter(
    (tab) => !disabledViews.includes(tab.value),
  );
  const selectedTabIndex = visibleTabs.findIndex(
    (tab) => tab.value === viewType,
  );

  const navRect = navRef.current?.getBoundingClientRect();
  const selectedDesktopRect =
    desktopButtonRefs.current[selectedTabIndex]?.getBoundingClientRect();
  const hoveredDesktopRect =
    hoveredTabIndex !== null
      ? desktopButtonRefs.current[hoveredTabIndex]?.getBoundingClientRect()
      : null;

  const updateView = (tabValue: CalendarViewType) => {
    if (!disabledViews.includes(tabValue)) {
      onChange(tabValue);
      setView(tabValue);
    }
  };

  const handleTabClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const tabValue = e.currentTarget.dataset.value as CalendarViewType;
    if (e.currentTarget.dataset.dropdown !== 'true') {
      updateView(tabValue);
    }
  };

  const handleDropdownClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const tabValue = e.currentTarget.dataset.value as CalendarViewType;
    updateView(tabValue);
  };

  const handleDaysOptionClick = async (days: number) => {
    setStoreDaysCount(days);
    try {
      await setQueryDaysCount(days);
      updateView(CalendarViewType.DAYS);
    } catch (error) {
      console.error('Failed to update URL state:', error);
    }
  };

  return (
    <div className={cn('border-border relative border-b', className)}>
      <div
        ref={navRef}
        className="relative z-0 flex items-center justify-start py-2"
        onPointerLeave={() => setHoveredTabIndex(null)}
      >
        {visibleTabs.map((tab, i) => {
          const isActive = viewType === tab.value;

          if (tab.hasDropdown) {
            return (
              <DropdownMenu key={tab.value}>
                <DropdownMenuTrigger asChild>
                  <button
                    ref={(el) => {
                      if (el) desktopButtonRefs.current[i] = el;
                    }}
                    disabled={disabledViews.includes(tab.value)}
                    data-value={tab.value}
                    data-dropdown="true"
                    onPointerEnter={() => setHoveredTabIndex(i)}
                    onFocus={() => setHoveredTabIndex(i)}
                    className={cn(
                      'relative z-20 flex h-8 cursor-pointer items-center gap-1 rounded-md bg-transparent px-4 text-sm select-none',
                      isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground',
                      disabledViews.includes(tab.value) &&
                        'cursor-not-allowed opacity-50',
                    )}
                    aria-selected={isActive}
                    role="tab"
                  >
                    {tab.label} ({storeDaysCount})
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {daysOptions.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => handleDaysOptionClick(option)}
                      className={cn(
                        'cursor-pointer',
                        storeDaysCount === option && 'bg-muted font-medium',
                      )}
                    >
                      {option} days
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <button
              key={tab.value}
              ref={(el) => {
                if (el) desktopButtonRefs.current[i] = el;
              }}
              disabled={disabledViews.includes(tab.value)}
              onClick={handleTabClick}
              data-value={tab.value}
              onPointerEnter={() => setHoveredTabIndex(i)}
              onFocus={() => setHoveredTabIndex(i)}
              className={cn(
                'relative z-20 flex h-8 cursor-pointer items-center rounded-md bg-transparent px-4 text-sm select-none',
                isActive
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground',
                disabledViews.includes(tab.value) &&
                  'cursor-not-allowed opacity-50',
              )}
              aria-selected={isActive}
              role="tab"
            >
              {tab.label}
            </button>
          );
        })}
        <AnimatePresence>
          {hoveredDesktopRect && navRect && (
            <motion.div
              key="hover"
              className="bg-muted absolute top-0 left-0 z-10 rounded-md"
              initial={{
                ...getHoverAnimationProps(hoveredDesktopRect, navRect),
                opacity: 0,
              }}
              animate={{
                ...getHoverAnimationProps(hoveredDesktopRect, navRect),
                opacity: 1,
              }}
              exit={{
                ...getHoverAnimationProps(hoveredDesktopRect, navRect),
                opacity: 0,
              }}
              transition={transition}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {selectedDesktopRect && navRect && (
            <motion.div
              className="bg-foreground absolute bottom-0 left-0 z-10 h-[2px]"
              initial={false}
              animate={{
                width: selectedDesktopRect.width - 16,
                x: selectedDesktopRect.left - navRect.left + 8,
                opacity: 1,
              }}
              transition={transition}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
