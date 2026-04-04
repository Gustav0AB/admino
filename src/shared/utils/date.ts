import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(localizedFormat);

export const DISPLAY_TIMEZONE = "UTC";

export const dateFormat = {
  planDate:        (iso: string) => dayjs(iso).utc().format("MMM D, YYYY"),
  planDateShort:   (iso: string) => dayjs(iso).utc().format("MMM D"),
  planDatetime:    (iso: string) => dayjs(iso).utc().format("MMM D, YYYY h:mm A"),
  planDateRange:   (start: string, end: string) =>
    `${dayjs(start).utc().format("MMM D")} – ${dayjs(end).utc().format("MMM D, YYYY")}`,
  weekLabel:       (iso: string) => `Week of ${dayjs(iso).utc().format("MMM D")}`,
  relative:        (iso: string) => dayjs(iso).fromNow(),
  iso:             (date?: dayjs.ConfigType) => dayjs(date).toISOString(),
  durationWeeks:   (start: string, end: string) =>
    dayjs(end).diff(dayjs(start), "week"),
};

export { dayjs };
