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
import { CalendarDays, ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";

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
  primary: "ui-button-primary",
  secondary: "ui-button-secondary",
  ghost: "ui-button-ghost",
  danger: "ui-button-danger",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "ui-button-sm", md: "ui-button-md", lg: "ui-button-lg",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; loadingText?: string;
};
export function Button({ variant = "primary", size = "md", loading = false, loadingText = "Cargando...", disabled, children, className = "", ...props }: ButtonProps) {
  return (
    <button disabled={disabled || loading} className={classes(
      "ui-button",
      buttonVariants[variant], buttonSizes[size], className
    )} {...props}>
      {loading ? <><Spinner />{loadingText}</> : children}
    </button>
  );
}

function Spinner() {
  return <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden />;
}

type CardProps = HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" | "lg" };
const cardPadding = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };
export function Card({ children, padding = "md", className = "", ...props }: CardProps) {
  return <div className={classes("ui-card", cardPadding[padding], className)} {...props}>{children}</div>;
}

type DropdownOption<T extends string = string> = { label: string; value: T };
type DropdownProps<T extends string = string> = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
  label?: string; options: DropdownOption<T>[]; value?: T; onChange?: (value: T) => void;
  placeholder?: string; error?: string; helperText?: string;
};
export function Dropdown<T extends string = string>({ label, options, value, onChange, placeholder, error, helperText, id, className = "", ...props }: DropdownProps<T>) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return <div className="flex flex-col gap-1">
    {label && <label htmlFor={selectId} className="text-sm font-medium text-gray-700">{label}</label>}
    <select id={selectId} value={value ?? ""} onChange={(event) => onChange?.(event.target.value as T)}
      className={classes("ui-input ui-select", error && "ui-input-error", className)} {...props}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {error ? <p className="text-xs text-danger">{error}</p> : helperText && <p className="text-xs text-gray-500">{helperText}</p>}
  </div>;
}

type ChipOption<T extends string = string> = { label: string; value: T; color?: string };
type ChipGroupProps<T extends string = string> = {
  label?: string; options: ChipOption<T>[]; value: T; onChange: (value: T) => void;
};
export function ChipGroup<T extends string = string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs font-semibold text-gray-500">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs ${active && !option.color ? "border-primary bg-blue-50 text-primary" : "border-gray-200 text-gray-700"}`}
              style={option.color ? {
                borderColor: active ? option.color : "#E5E7EB",
                backgroundColor: active ? `${option.color}22` : "transparent",
                color: active ? option.color : "#374151",
              } : undefined}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string; error?: string; helperText?: string;
};
export function TextField({ label, error, helperText, id, className = "", ...props }: TextFieldProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return <div className="flex flex-col gap-1">
    {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
    <input id={inputId} className={classes(
      "ui-input",
      error && "ui-input-error", className
    )} {...props} />
    {error ? <p className="text-xs text-danger">{error}</p> : helperText && <p className="text-xs text-gray-500">{helperText}</p>}
  </div>;
}

type ModalProps = {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
  footer?: ReactNode; closeLabel?: string;
};
export function Modal({ open, onClose, title, children, footer, closeLabel = "Cerrar" }: ModalProps) {
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
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" aria-label={closeLabel}><X className="h-5 w-5" aria-hidden /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      {footer && <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 px-6 py-4">{footer}</div>}
    </div>
  </div>;
}

type ConfirmModalProps = {
  open: boolean; title: string; message: string; onClose: () => void; onConfirm: () => Promise<void>;
  cancelText?: string; confirmText?: string; loadingText?: string; genericError?: string; closeLabel?: string;
};
export function ConfirmModal({ open, title, message, onClose, onConfirm, cancelText = "Cancelar", confirmText = "Eliminar", loadingText, genericError = "Algo salió mal.", closeLabel }: ConfirmModalProps) {
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

export type Column<T> = {
  key: string; header: string; render?: (row: T, index: number) => ReactNode; align?: "left" | "center" | "right";
};
type TableProps<T> = {
  columns: Column<T>[]; rows: T[]; keyExtractor: (row: T, index: number) => string;
  loading?: boolean; emptyText?: string; pageSize?: number;
  labels?: Partial<{ loading: string; noData: string; rowsPerPage: string; of: string; prevPage: string; nextPage: string }>;
};
const alignment = { left: "text-left", center: "text-center", right: "text-right" } as const;
const pageSizes = [10, 25, 50, 100];
export function Table<T extends Record<string, unknown>>({ columns, rows, keyExtractor, loading = false, emptyText, pageSize: initialSize, labels }: TableProps<T>) {
  const text = { loading: "Cargando...", noData: "Sin datos.", rowsPerPage: "Filas por página", of: "de", prevPage: "Página anterior", nextPage: "Página siguiente", ...labels };
  const paginated = initialSize !== undefined;
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialSize ?? 25);
  useEffect(() => setPage(0), [rows, size]);
  const totalPages = Math.ceil(rows.length / size);
  const visible = paginated ? rows.slice(page * size, (page + 1) * size) : rows;
  const from = rows.length ? page * size + 1 : 0;
  const to = Math.min((page + 1) * size, rows.length);
  return <div className="ui-table-block">
    <div className="ui-table-scroll"><table className="ui-table">
      <thead><tr>{columns.map((column) => <th key={column.key} className={alignment[column.align ?? "left"]}>{column.header}</th>)}</tr></thead>
      <tbody>
        {loading ? <TableMessage span={columns.length}>{text.loading}</TableMessage>
          : !rows.length ? <TableMessage span={columns.length}>{emptyText ?? text.noData}</TableMessage>
          : visible.map((row, index) => <tr key={keyExtractor(row, index)}>
            {columns.map((column) => <td key={column.key} className={alignment[column.align ?? "left"]}>
              {column.render ? column.render(row, index) : String(row[column.key] ?? "")}
            </td>)}
          </tr>)}
      </tbody>
    </table></div>
    {paginated && !loading && rows.length > 0 && <div className="ui-table-footer">
      <div className="ui-table-page-size"><span>{text.rowsPerPage}</span><select value={size} onChange={(event) => setSize(Number(event.target.value))} className="ui-input">
        {pageSizes.map((value) => <option key={value} value={value}>{value}</option>)}
      </select></div>
      <div className="ui-table-pagination"><span>{from}-{to} {text.of} {rows.length}</span><div className="ui-table-page-buttons">
        <PageButton label={text.prevPage} disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} direction="left" />
        <span>{page + 1} / {totalPages}</span>
        <PageButton label={text.nextPage} disabled={page >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} direction="right" />
      </div></div>
    </div>}
  </div>;
}

function TableMessage({ span, children }: { span: number; children: ReactNode }) {
  return <tr><td colSpan={span} className="ui-table-message">{children}</td></tr>;
}
function PageButton({ label, disabled, onClick, direction }: { label: string; disabled: boolean; onClick: () => void; direction: "left" | "right" }) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="ui-icon-button">
    {direction === "left" ? <ChevronLeft /> : <ChevronRight />}
  </button>;
}

type DatePickerProps = {
  label?: string; value: string; onChange: (value: string) => void; placeholder?: string;
};
const WEEK_REF = new Date(2023, 0, 1);
const locale = "es-MX";

function parseLocal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function toISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function DatePicker({ label, value, onChange, placeholder = "Selecciona fecha" }: DatePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => value ? parseLocal(value) : new Date(today.getFullYear(), today.getMonth(), 1));
  const ref = useRef<HTMLDivElement>(null);
  const months = useMemo(() => Array.from({ length: 12 }, (_, month) => new Date(2023, month, 1).toLocaleDateString(locale, { month: "long" })), []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(WEEK_REF);
    date.setDate(WEEK_REF.getDate() + index);
    return date.toLocaleDateString(locale, { weekday: "short" });
  }), []);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells: (number | null)[] = [
    ...Array<null>(new Date(year, month, 1).getDay()).fill(null),
    ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selected = value ? parseLocal(value) : null;
  const displayValue = selected ? selected.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" }) : "";
  const isSelected = (day: number) => selected && day === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  function select(day: number) {
    onChange(toISO(new Date(year, month, day)));
    setOpen(false);
  }

  return <div className="ui-datepicker" ref={ref}>
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <button type="button" className="ui-datepicker-trigger" onClick={() => setOpen((current) => !current)}>
      <span className={displayValue ? "" : "ui-datepicker-placeholder"}>{displayValue || placeholder}</span>
      <CalendarDays />
    </button>
    {open && <div className="ui-datepicker-popover">
      <div className="ui-datepicker-header">
        <button type="button" className="ui-icon-button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mes anterior"><ChevronLeft /></button>
        <strong>{capitalize(months[month] ?? "")} {year}</strong>
        <button type="button" className="ui-icon-button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mes siguiente"><ChevronRight /></button>
      </div>
      <div className="ui-datepicker-weekdays">{days.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="ui-datepicker-days">
        {cells.map((day, index) => <div key={index}>
          {day !== null && <button
            type="button"
            className={classes("ui-datepicker-day", isSelected(day) && "selected", isToday(day) && "today")}
            onClick={() => select(day)}
          >
            {day}
          </button>}
        </div>)}
      </div>
      {value && <button type="button" className="ui-datepicker-clear" onClick={() => { onChange(""); setOpen(false); }}>Limpiar</button>}
    </div>}
  </div>;
}
