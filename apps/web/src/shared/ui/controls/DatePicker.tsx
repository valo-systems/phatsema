import { DatePicker as ArkDatePicker, Portal } from '@ark-ui/react';
import { parseDate } from '@internationalized/date';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { controlSize, fieldShell, popoverSurface, type ControlSize } from './styles';

export interface DatePickerProps {
  /** ISO date string, `YYYY-MM-DD`, matching the API contract. */
  value: string;
  onValueChange: (value: string) => void;
  max?: string | undefined;
  min?: string | undefined;
  size?: ControlSize;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  className?: string | undefined;
  'aria-label'?: string;
}

const cell =
  'size-8 rounded-sm text-sm text-ink data-[in-range]:bg-primary-soft ' +
  'data-[today]:font-semibold data-[today]:text-primary ' +
  'data-[selected]:bg-primary data-[selected]:text-white ' +
  'data-[outside-range]:text-faint data-[disabled]:text-faint data-[disabled]:cursor-not-allowed ' +
  'hover:data-[selectable]:bg-sunken focus-ring';

/**
 * Ark works in calendar objects; the rest of the app works in ISO strings to
 * match the API contract. Conversion is contained here so no caller sees it.
 * An unparseable value yields an empty picker rather than throwing.
 */
function toCalendarValue(value: string) {
  if (!value) return [];
  try {
    return [parseDate(value)];
  } catch {
    return [];
  }
}

/**
 * Replaces `<input type="date">`, whose calendar is drawn by the OS and cannot
 * be styled or made consistent across platforms.
 */
export function DatePicker({
  value,
  onValueChange,
  max,
  min,
  size = 'md',
  disabled = false,
  invalid = false,
  placeholder = 'Select date',
  className,
  ...rest
}: DatePickerProps) {
  return (
    <ArkDatePicker.Root
      value={toCalendarValue(value)}
      onValueChange={(details) => onValueChange(details.valueAsString[0] ?? '')}
      {...(max ? { max: parseDate(max) } : {})}
      {...(min ? { min: parseDate(min) } : {})}
      disabled={disabled}
      positioning={{ gutter: 4 }}
      className={cn('w-full', className)}
    >
      <ArkDatePicker.Control
        className={cn(
          fieldShell,
          controlSize[size],
          'inline-flex items-center px-0 focus-within:shadow-[var(--focus-ring)]',
          invalid && 'border-danger',
        )}
      >
        <ArkDatePicker.Input
          placeholder={placeholder}
          aria-label={rest['aria-label']}
          className="numeric h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-faint"
        />
        <ArkDatePicker.Trigger
          aria-label="Open calendar"
          className="grid h-full shrink-0 place-items-center border-l border-line px-2.5 text-muted hover:bg-sunken hover:text-ink"
        >
          <CalendarDays aria-hidden className="size-4" />
        </ArkDatePicker.Trigger>
      </ArkDatePicker.Control>
      <Portal>
        <ArkDatePicker.Positioner>
          <ArkDatePicker.Content className={cn(popoverSurface, 'p-3')}>
            <ArkDatePicker.View view="day">
              <ArkDatePicker.Context>
                {(api) => (
                  <>
                    <ArkDatePicker.ViewControl className="mb-2 flex items-center justify-between">
                      <ArkDatePicker.PrevTrigger
                        aria-label="Previous month"
                        className="focus-ring grid size-7 place-items-center rounded-sm text-muted hover:bg-sunken hover:text-ink"
                      >
                        <ChevronLeft aria-hidden className="size-4" />
                      </ArkDatePicker.PrevTrigger>
                      <ArkDatePicker.ViewTrigger className="focus-ring rounded-sm px-2 py-1 text-sm font-medium text-ink hover:bg-sunken">
                        <ArkDatePicker.RangeText />
                      </ArkDatePicker.ViewTrigger>
                      <ArkDatePicker.NextTrigger
                        aria-label="Next month"
                        className="focus-ring grid size-7 place-items-center rounded-sm text-muted hover:bg-sunken hover:text-ink"
                      >
                        <ChevronRight aria-hidden className="size-4" />
                      </ArkDatePicker.NextTrigger>
                    </ArkDatePicker.ViewControl>
                    <ArkDatePicker.Table>
                      <ArkDatePicker.TableHead>
                        <ArkDatePicker.TableRow>
                          {api.weekDays.map((day) => (
                            <ArkDatePicker.TableHeader
                              key={day.long}
                              className="size-8 text-[11px] font-medium text-muted"
                            >
                              {day.narrow}
                            </ArkDatePicker.TableHeader>
                          ))}
                        </ArkDatePicker.TableRow>
                      </ArkDatePicker.TableHead>
                      <ArkDatePicker.TableBody>
                        {api.weeks.map((week, weekIndex) => (
                          <ArkDatePicker.TableRow key={weekIndex}>
                            {week.map((day, dayIndex) => (
                              <ArkDatePicker.TableCell key={dayIndex} value={day}>
                                <ArkDatePicker.TableCellTrigger className={cell}>
                                  {day.day}
                                </ArkDatePicker.TableCellTrigger>
                              </ArkDatePicker.TableCell>
                            ))}
                          </ArkDatePicker.TableRow>
                        ))}
                      </ArkDatePicker.TableBody>
                    </ArkDatePicker.Table>
                  </>
                )}
              </ArkDatePicker.Context>
            </ArkDatePicker.View>
          </ArkDatePicker.Content>
        </ArkDatePicker.Positioner>
      </Portal>
    </ArkDatePicker.Root>
  );
}
