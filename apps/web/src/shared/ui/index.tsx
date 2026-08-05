import {
  useEffect,
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
  return <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>;
}

type CardProps = HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" | "lg" };
const cardPadding = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };
export function Card({ children, padding = "md", className = "", ...props }: CardProps) {
  return <div className={classes("rounded-xl border border-gray-200 bg-white shadow-sm", cardPadding[padding], className)} {...props}>{children}</div>;
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

type DatePickerProps = {
  label?: string; value: string; onChange: (value: string) => void;
};
export function DatePicker({ label, value, onChange }: DatePickerProps) {
  return <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <div className="flex gap-2">
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="ui-input min-w-0 flex-1"
      />
      {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>Limpiar</Button>}
    </div>
  </div>;
}
