import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

const classes = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(" ");

type Color = "gray" | "blue" | "green" | "red" | "yellow" | "purple";
const badgeColors: Record<Color, string> = {
  gray: "bg-gray-100 text-gray-600",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({ children, color = "gray", className = "" }: {
  children: ReactNode; color?: Color; className?: string;
}) {
  return <span className={classes("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", badgeColors[color], className)}>{children}</span>;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover focus:ring-primary",
  secondary: "bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
  danger: "bg-danger text-white hover:bg-danger-hover focus:ring-danger",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; loadingText?: string;
};
export function Button({ variant = "primary", size = "md", loading = false, loadingText = "Loading…", disabled, children, className = "", ...props }: ButtonProps) {
  return (
    <button disabled={disabled || loading} className={classes(
      "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150",
      buttonVariants[variant], buttonSizes[size], className
    )} {...props}>
      {loading ? <><Spinner />{loadingText}</> : children}
    </button>
  );
}

function Spinner() {
  return <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>;
}

export type CardProps = HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" | "lg" };
const cardPadding = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };
export function Card({ children, padding = "md", className = "", ...props }: CardProps) {
  return <div className={classes("rounded-xl border border-gray-200 bg-white shadow-sm", cardPadding[padding], className)} {...props}>{children}</div>;
}

export type DropdownOption<T extends string = string> = { label: string; value: T };
export type DropdownProps<T extends string = string> = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
  label?: string; options: DropdownOption<T>[]; value?: T; onChange?: (value: T) => void;
  placeholder?: string; error?: string; helperText?: string;
};
export function Dropdown<T extends string = string>({ label, options, value, onChange, placeholder, error, helperText, id, className = "", ...props }: DropdownProps<T>) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return <div className="flex flex-col gap-1">
    {label && <label htmlFor={selectId} className="text-sm font-medium text-gray-700">{label}</label>}
    <select id={selectId} value={value ?? ""} onChange={(event) => onChange?.(event.target.value as T)}
      className={classes("h-9 rounded-md border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
        error ? "border-danger focus:border-danger focus:ring-danger" : "border-gray-300 focus:border-primary focus:ring-primary", className)} {...props}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {error ? <p className="text-xs text-danger">{error}</p> : helperText && <p className="text-xs text-gray-500">{helperText}</p>}
  </div>;
}

type LabelVariant = "title" | "subtitle" | "label" | "caption";
const labelClasses: Record<LabelVariant, string> = {
  title: "text-xl font-semibold text-gray-900", subtitle: "text-base font-medium text-gray-700",
  label: "text-sm font-medium text-gray-700", caption: "text-xs text-gray-500",
};
const labelTags: Record<LabelVariant, keyof React.JSX.IntrinsicElements> = {
  title: "h2", subtitle: "h3", label: "span", caption: "span",
};
export type LabelProps = HTMLAttributes<HTMLElement> & {
  variant?: LabelVariant; as?: keyof React.JSX.IntrinsicElements; htmlFor?: string;
};
export function Label({ variant = "label", as, children, className = "", ...props }: LabelProps) {
  const Tag = (as ?? labelTags[variant]) as React.ElementType;
  return <Tag className={classes(labelClasses[variant], className)} {...props}>{children}</Tag>;
}

export type ListProps<T> = {
  items: T[]; renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string; emptyText?: string; divided?: boolean;
};
export function List<T>({ items, renderItem, keyExtractor, emptyText = "No items.", divided = true }: ListProps<T>) {
  if (!items.length) return <p className="py-6 text-center text-sm text-gray-400">{emptyText}</p>;
  return <ul className={classes("rounded-lg border border-gray-200 bg-white", divided && "divide-y divide-gray-200")}>
    {items.map((item, index) => <li key={keyExtractor(item, index)} className="px-4 py-3">{renderItem(item, index)}</li>)}
  </ul>;
}

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string; error?: string; helperText?: string;
};
export function TextField({ label, error, helperText, id, className = "", ...props }: TextFieldProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return <div className="flex flex-col gap-1">
    {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
    <input id={inputId} className={classes(
      "rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
      error ? "border-danger focus:border-danger focus:ring-danger" : "border-gray-300 focus:border-primary focus:ring-primary", className
    )} {...props} />
    {error ? <p className="text-xs text-danger">{error}</p> : helperText && <p className="text-xs text-gray-500">{helperText}</p>}
  </div>;
}

export type ModalProps = {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
  footer?: ReactNode; closeLabel?: string;
};
export function Modal({ open, onClose, title, children, footer, closeLabel = "Close" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
    <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-gray-200 bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="components-modal-title">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 id="components-modal-title" className="text-base font-semibold text-gray-900">{title}</h2>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" aria-label={closeLabel}><CloseIcon /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      {footer && <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 px-6 py-4">{footer}</div>}
    </div>
  </div>;
}

function CloseIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
}

export type ConfirmModalProps = {
  open: boolean; title: string; message: string; onClose: () => void; onConfirm: () => Promise<void>;
  cancelText?: string; confirmText?: string; loadingText?: string; genericError?: string; closeLabel?: string;
};
export function ConfirmModal({ open, title, message, onClose, onConfirm, cancelText = "Cancel", confirmText = "Delete", loadingText, genericError = "Something went wrong.", closeLabel }: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleConfirm() {
    setLoading(true); setError(null);
    try { await onConfirm(); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : genericError); }
    finally { setLoading(false); }
  }
  return <Modal open={open} onClose={onClose} title={title} closeLabel={closeLabel} footer={<>
    <Button variant="ghost" onClick={onClose}>{cancelText}</Button>
    <Button variant="danger" loading={loading} loadingText={loadingText} onClick={handleConfirm}>{confirmText}</Button>
  </>}>
    <p className="text-sm text-gray-600">{message}</p>
    {error && <p className="mt-2 text-sm text-danger">{error}</p>}
  </Modal>;
}

export function OfflineBanner({ text = "You are offline." }: { text?: string }) {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const offline = () => setIsOffline(true);
    const online = () => setIsOffline(false);
    window.addEventListener("offline", offline); window.addEventListener("online", online);
    return () => { window.removeEventListener("offline", offline); window.removeEventListener("online", online); };
  }, []);
  if (!isOffline) return null;
  return <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg sm:w-auto">
    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />{text}
  </div>;
}

export type Column<T> = {
  key: string; header: string; render?: (row: T, index: number) => ReactNode; align?: "left" | "center" | "right";
};
export type TableProps<T> = {
  columns: Column<T>[]; rows: T[]; keyExtractor: (row: T, index: number) => string;
  loading?: boolean; emptyText?: string; pageSize?: number;
  labels?: Partial<{ loading: string; noData: string; rowsPerPage: string; of: string; prevPage: string; nextPage: string }>;
};
const alignment = { left: "text-left", center: "text-center", right: "text-right" } as const;
const pageSizes = [10, 25, 50, 100];
export function Table<T extends Record<string, unknown>>({ columns, rows, keyExtractor, loading = false, emptyText, pageSize: initialSize, labels }: TableProps<T>) {
  const text = { loading: "Loading…", noData: "No data.", rowsPerPage: "Rows per page", of: "of", prevPage: "Previous page", nextPage: "Next page", ...labels };
  const paginated = initialSize !== undefined;
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialSize ?? 25);
  useEffect(() => setPage(0), [rows, size]);
  const totalPages = Math.ceil(rows.length / size);
  const visible = paginated ? rows.slice(page * size, (page + 1) * size) : rows;
  const from = rows.length ? page * size + 1 : 0;
  const to = Math.min((page + 1) * size, rows.length);
  return <div className="space-y-2">
    <div className="overflow-x-auto rounded-lg border border-gray-200"><table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
      <thead className="bg-gray-50"><tr>{columns.map((column) => <th key={column.key} className={classes("px-4 py-3 font-medium text-gray-600", alignment[column.align ?? "left"])}>{column.header}</th>)}</tr></thead>
      <tbody className="divide-y divide-gray-100">
        {loading ? <TableMessage span={columns.length}>{text.loading}</TableMessage>
          : !rows.length ? <TableMessage span={columns.length}>{emptyText ?? text.noData}</TableMessage>
          : visible.map((row, index) => <tr key={keyExtractor(row, index)} className="transition-colors hover:bg-gray-50">
            {columns.map((column) => <td key={column.key} className={classes("px-4 py-3 text-gray-700", alignment[column.align ?? "left"])}>
              {column.render ? column.render(row, index) : String(row[column.key] ?? "")}
            </td>)}
          </tr>)}
      </tbody>
    </table></div>
    {paginated && !loading && rows.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-gray-500">
      <div className="flex items-center gap-2"><span>{text.rowsPerPage}</span><select value={size} onChange={(event) => setSize(Number(event.target.value))} className="rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
        {pageSizes.map((value) => <option key={value} value={value}>{value}</option>)}
      </select></div>
      <div className="flex items-center gap-3"><span>{from}–{to} {text.of} {rows.length}</span><div className="flex items-center gap-1">
        <PageButton label={text.prevPage} disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} direction="left" />
        <span className="min-w-[4rem] text-center">{page + 1} / {totalPages}</span>
        <PageButton label={text.nextPage} disabled={page >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} direction="right" />
      </div></div>
    </div>}
  </div>;
}

function TableMessage({ span, children }: { span: number; children: ReactNode }) {
  return <tr><td colSpan={span} className="py-8 text-center text-gray-400">{children}</td></tr>;
}
function PageButton({ label, disabled, onClick, direction }: { label: string; disabled: boolean; onClick: () => void; direction: "left" | "right" }) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="rounded p-1 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} /></svg>
  </button>;
}

export type DatePickerProps = {
  label?: string; value: string; onChange: (value: string) => void; placeholder?: string;
  locale?: string; clearText?: string;
};
const weekReference = new Date(2023, 0, 1);
const parseLocal = (iso: string) => { const [year, month, day] = iso.split("-").map(Number); return new Date(year!, month! - 1, day); };
const toISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function DatePicker({ label, value, onChange, placeholder = "Select a date", locale = "en-US", clearText = "Clear" }: DatePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => value ? parseLocal(value) : new Date(today.getFullYear(), today.getMonth(), 1));
  const ref = useRef<HTMLDivElement>(null);
  const months = useMemo(() => Array.from({ length: 12 }, (_, month) => new Date(2023, month, 1).toLocaleDateString(locale, { month: "long" })), [locale]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekReference); date.setDate(weekReference.getDate() + index);
    return date.toLocaleDateString(locale, { weekday: "short" });
  }), [locale]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => ref.current && !ref.current.contains(event.target as Node) && setOpen(false);
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [open]);
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const cells: (number | null)[] = [...Array<null>(new Date(year, month, 1).getDay()).fill(null), ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);
  const selected = value ? parseLocal(value) : null;
  const display = selected?.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  return <div className="relative flex flex-col gap-1" ref={ref}>
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <button type="button" onClick={() => setOpen((current) => !current)} className="flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
      <span className={display ? "text-gray-900" : "text-gray-400"}>{display || placeholder}</span><CalendarIcon />
    </button>
    {open && <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <PageButton label="Previous month" disabled={false} onClick={() => setCursor(new Date(year, month - 1, 1))} direction="left" />
        <span className="text-sm font-semibold text-gray-800">{months[month]!.charAt(0).toUpperCase() + months[month]!.slice(1)} {year}</span>
        <PageButton label="Next month" disabled={false} onClick={() => setCursor(new Date(year, month + 1, 1))} direction="right" />
      </div>
      <div className="mb-1 grid grid-cols-7 text-center">{days.map((day) => <span key={day} className="py-1 text-xs font-medium text-gray-400">{day}</span>)}</div>
      <div className="grid grid-cols-7">{cells.map((day, index) => <div key={index} className="aspect-square p-0.5">{day !== null && <button type="button" onClick={() => { onChange(toISO(new Date(year, month, day))); setOpen(false); }}
        className={classes("h-full w-full rounded-full text-sm font-medium transition-colors",
          selected && day === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear() ? "bg-primary text-white"
            : day === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? "border border-primary text-primary" : "text-gray-700 hover:bg-gray-100")}>{day}</button>}</div>)}</div>
      {value && <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600">{clearText}</button>}
    </div>}
  </div>;
}
function CalendarIcon() {
  return <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M8 2v3m8-3v3M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" /></svg>;
}
