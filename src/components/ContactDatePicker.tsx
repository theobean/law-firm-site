import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

function dateKey(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const first = addDays(date, 1 - date.getDate());
  first.setMonth(first.getMonth() + months);
  const last = new Date(first);
  last.setMonth(last.getMonth() + 1, 0);
  return addDays(first, Math.min(date.getDate(), last.getDate()) - 1);
}

function weekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function calendarWeeks(date: Date) {
  const first = addDays(date, 1 - date.getDate());
  const nextMonth = addMonths(first, 1);
  const start = addDays(first, -weekdayIndex(first));
  const weeks: Date[][] = [];

  for (let monday = start; monday < nextMonth; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(monday, index)));
  }

  return weeks;
}

const navigationClass = "grid h-10 w-7 shrink-0 place-items-center rounded-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent max-[359px]:hidden sm:w-9";
const selectClass = "h-10 w-full appearance-none rounded-sm border border-white/20 bg-white/10 pl-1.5 pr-5 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-accent [color-scheme:dark] sm:pl-2";
const selectIconClass = "pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-accent";
const actionClass = "min-h-10 rounded-sm px-2 text-sm font-medium hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-45 disabled:hover:bg-transparent";

export default function ContactDatePicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("contact.calendar");
  const dateLocale = locale === "en" ? "en-GB" : locale;
  const [activeDate, setActiveDate] = useState<Date | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const activeDay = useRef<HTMLButtonElement>(null);
  const shouldFocusDay = useRef(false);
  const selectedDate = value ? new Date(`${value}T12:00:00`) : null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayKey = dateKey(today);
  const monthId = `${id}-month`;
  const panelId = `${id}-calendar`;
  const activeYear = activeDate?.getFullYear() ?? today.getFullYear();
  const firstYear = Math.min(today.getFullYear() - 100, activeYear);
  const lastYear = Math.max(today.getFullYear() + 50, activeYear);

  useEffect(() => {
    if (activeDate && shouldFocusDay.current) {
      shouldFocusDay.current = false;
      activeDay.current?.focus();
    }
  }, [activeDate]);

  function close() {
    setActiveDate(null);
    trigger.current?.focus();
  }

  function select(date: Date | null) {
    onChange(date ? dateKey(date) : "");
    close();
  }

  function moveWithKeyboard(event: KeyboardEvent, day: Date) {
    let next: Date;
    switch (event.key) {
      case "ArrowLeft": next = addDays(day, -1); break;
      case "ArrowRight": next = addDays(day, 1); break;
      case "ArrowUp": next = addDays(day, -7); break;
      case "ArrowDown": next = addDays(day, 7); break;
      case "Home": next = addDays(day, -weekdayIndex(day)); break;
      case "End": next = addDays(day, 6 - weekdayIndex(day)); break;
      case "PageUp": next = addMonths(day, event.shiftKey ? -12 : -1); break;
      case "PageDown": next = addMonths(day, event.shiftKey ? 12 : 1); break;
      default: return;
    }
    event.preventDefault();
    shouldFocusDay.current = true;
    setActiveDate(next);
  }

  const weeks = activeDate ? calendarWeeks(activeDate) : [];
  const weekDayShort = new Intl.DateTimeFormat(dateLocale, { weekday: "short" });
  const weekDayLong = new Intl.DateTimeFormat(dateLocale, { weekday: "long" });
  const fullDate = new Intl.DateTimeFormat(dateLocale, { dateStyle: "full" });
  const monthName = new Intl.DateTimeFormat(dateLocale, { month: "long" });

  return (
    <div onKeyDown={(event) => {
      if (event.key === "Escape" && activeDate) {
        event.preventDefault();
        close();
      }
    }}>
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-expanded={Boolean(activeDate)}
        aria-controls={activeDate ? panelId : undefined}
        onClick={() => {
          if (activeDate) {
            close();
          } else {
            shouldFocusDay.current = true;
            setActiveDate(selectedDate ?? today);
          }
        }}
        className="flex min-h-[50px] w-full items-center gap-3 rounded-sm border border-gray-300 px-4 py-3 text-left transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-primary aria-expanded:border-accent"
      >
        <span id={`${id}-value`} className={`flex-1 ${selectedDate ? "text-primary" : "text-gray-600"}`}>
          {selectedDate
            ? new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(selectedDate)
            : t("choose")}
        </span>
        <CalendarDays size={18} className="shrink-0 text-accent" aria-hidden="true" />
      </button>

      {activeDate && (
        <div id={panelId} className="mt-2 w-full max-w-sm rounded-sm border border-accent/30 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-1 rounded-t-sm bg-primary px-2 py-1.5 text-white">
            <button type="button" aria-label={t("previousMonth")} className={navigationClass} onClick={() => setActiveDate(addMonths(activeDate, -1))}>
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <p id={monthId} aria-live="polite" className="sr-only">
              {new Intl.DateTimeFormat(dateLocale, { month: "long", year: "numeric" }).format(activeDate)}
            </p>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2">
              <div className="relative min-w-0 flex-1 sm:max-w-40">
                <select
                  aria-label={t("month")}
                  value={activeDate.getMonth() + 1}
                  onChange={event => setActiveDate(addMonths(activeDate, Number(event.target.value) - 1 - activeDate.getMonth()))}
                  className={selectClass}
                >
                  {Array.from({ length: 12 }, (_, month) => (
                    <option key={month} value={month + 1} className="bg-primary text-white">
                      {monthName.format(new Date(activeYear, month, 1))}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} aria-hidden="true" className={selectIconClass} />
              </div>
              <div className="relative w-[3.75rem] shrink-0 sm:w-[4.5rem]">
                <select
                  aria-label={t("year")}
                  value={activeYear}
                  onChange={event => setActiveDate(addMonths(activeDate, (Number(event.target.value) - activeYear) * 12))}
                  className={selectClass}
                >
                  {Array.from({ length: lastYear - firstYear + 1 }, (_, offset) => {
                    const year = firstYear + offset;
                    return <option key={year} value={year} className="bg-primary text-white">{year}</option>;
                  })}
                </select>
                <ChevronDown size={12} aria-hidden="true" className={selectIconClass} />
              </div>
            </div>
            <button type="button" aria-label={t("nextMonth")} className={navigationClass} onClick={() => setActiveDate(addMonths(activeDate, 1))}>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="px-1.5 py-2 sm:px-3">
            <table role="grid" aria-labelledby={monthId} className="w-full table-fixed">
              <thead>
                <tr>
                  {weeks[0].map(day => (
                    <th key={dateKey(day)} scope="col" abbr={weekDayLong.format(day)} className="pb-1 text-center text-xs font-medium text-gray-600">
                      {weekDayShort.format(day)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map(week => (
                  <tr key={dateKey(week[0])}>
                    {week.map(day => {
                      const key = dateKey(day);
                      if (day.getMonth() !== activeDate.getMonth()) return <td key={key} />;
                      const isSelected = key === value;
                      const isActive = day.getDate() === activeDate.getDate();
                      return (
                        <td key={key} aria-selected={isSelected} className="py-0.5 text-center">
                          <button
                            ref={isActive ? activeDay : undefined}
                            type="button"
                            data-date={key}
                            aria-label={fullDate.format(day)}
                            aria-current={key === todayKey ? "date" : undefined}
                            tabIndex={isActive ? 0 : -1}
                            onKeyDown={event => moveWithKeyboard(event, day)}
                            onClick={() => select(day)}
                            className={`mx-auto grid h-9 w-full max-w-10 place-items-center rounded-sm border text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent sm:h-10 ${
                              isSelected
                                ? "border-primary bg-primary font-semibold text-white"
                                : "border-transparent text-primary hover:bg-accent/10 aria-[current=date]:border-accent/70 aria-[current=date]:font-semibold"
                            }`}
                          >
                            {day.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between gap-2 border-t border-accent/20 px-2 py-1 text-primary sm:px-3">
            <button type="button" disabled={!value} className={actionClass} onClick={() => select(null)}>
              {t("clear")}
            </button>
            <button type="button" className={actionClass} onClick={() => select(today)}>
              {t("today")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
