// components/FormControls.tsx
import React, { memo, useCallback } from 'react';

/* =========================
   DNA Section
========================= */

export const DnaSection = memo(function DnaSection<Items extends string>({
  title,
  items,
  color,
}: {
  title: string;
  items: Items[];
  color: 'green' | 'red' | 'blue' | 'purple';
}) {
  if (!items || items.length === 0) return null;

  const borderByColor: Record<'green' | 'red' | 'blue' | 'purple', string> = {
    green: 'border-green-300/50',
    red: 'border-red-300/50',
    blue: 'border-blue-300/50',
    purple: 'border-purple-300/50',
  };

  return (
    <div>
      <p className="font-semibold text-text-secondary">{title}</p>
      <div
        className={`mt-1 flex flex-wrap gap-1.5 p-2 border-l-4 ${borderByColor[color]} bg-white/5 rounded-r-md`}
      >
        {items.map((item) => (
          <span
            key={item}
            className="bg-white/10 border border-white/10 px-2 py-0.5 rounded-full text-text-secondary"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
});

/* =========================
   Divider
========================= */

export const Divider = memo(function Divider() {
  return <div className="border-t border-white/10 my-4" />;
});

/* =========================
   Toggle Row
========================= */

export const ToggleRow = memo(function ToggleRow({
  label,
  description,
  isOn,
  onToggle,
}: {
  label: string;
  description?: string;
  isOn: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium text-text-secondary">{label}</label>
        {description && (
          <p className="text-xs text-text-secondary/80">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${
          isOn ? 'bg-accent' : 'bg-white/20'
        }`}
        aria-pressed={isOn}
        aria-label={label}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
            isOn ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
});

/* =========================
   Shared styles
========================= */

const formElementClasses =
  'block w-full bg-glass/50 backdrop-blur-sm border border-white/20 rounded-button shadow-inner shadow-black/40 text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-to/70 focus:border-brand-to transition-all duration-200 disabled:bg-white/5 disabled:cursor-not-allowed';

/* =========================
   Input Field
========================= */

export const InputField = memo(function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange]
  );

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${formElementClasses} text-sm py-2 px-3 ${className ?? ''}`}
      />
    </div>
  );
});

/* =========================
   Textarea Field
========================= */

export const TextareaField = memo(function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  onBlur,
  className,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  className?: string;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value),
    [onChange]
  );

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        rows={rows}
        placeholder={placeholder}
        className={`${formElementClasses} text-sm py-2 px-3 ${className ?? ''}`}
        disabled={disabled}
      />
    </div>
  );
});

/* =========================
   Select Field (generic, strongly typed)
========================= */

export const SelectField = memo(function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
  className,
}: {
  id: string;
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  className?: string;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as T),
    [onChange]
  );

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={handleChange}
        className={`${formElementClasses} text-sm py-2 px-3 ${className ?? ''}`}
        disabled={disabled}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-cosmic text-text-primary"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});
