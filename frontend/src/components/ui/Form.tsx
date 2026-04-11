import type { ReactNode, FormHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

/* =============================================================================
   FORM CONTAINER
   ============================================================================= */
export interface FormContainerProps extends FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
  children: ReactNode;
}

export function FormContainer({
  title,
  description,
  children,
  className = '',
  ...props
}: FormContainerProps) {
  return (
    <div className="panel mb-6 p-6">
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="heading-2">{title}</h2>}
          {description && <p className="body-text mt-1">{description}</p>}
        </div>
      )}
      <form className={`form-spacing ${className}`} {...props}>
        {children}
      </form>
    </div>
  );
}

/* =============================================================================
   FORM FIELD (Label wrapper with error handling)
   ============================================================================= */
export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={htmlFor} className="label-text flex items-center gap-1">
        {label}
        {required && <span className="text-ember">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate">{hint}</p>}
      {error && <p className="text-xs text-ember">{error}</p>}
    </div>
  );
}

/* =============================================================================
   FORM GRID (2-column layout)
   ============================================================================= */
export interface FormGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormGrid({ children, columns = 2, className = '' }: FormGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
  };

  return (
    <div className={`grid gap-4 ${colsClass[columns]} ${className}`}>{children}</div>
  );
}

/* =============================================================================
   INPUT
   ============================================================================= */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  variant?: 'default' | 'dish';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, variant = 'default', className = '', ...props }, ref) => {
    const baseClass = variant === 'dish' ? 'dish-field' : 'field';
    const errorClass = error ? 'field-error' : '';

    return (
      <input
        ref={ref}
        className={`${baseClass} ${errorClass} ${className}`.trim()}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

/* =============================================================================
   SELECT
   ============================================================================= */
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, error, className = '', ...props }, ref) => {
    const errorClass = error ? 'field-error' : '';

    return (
      <select ref={ref} className={`field ${errorClass} ${className}`.trim()} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';

/* =============================================================================
   TEXTAREA
   ============================================================================= */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', rows = 4, ...props }, ref) => {
    const errorClass = error ? 'field-error' : '';

    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`textarea-field ${errorClass} ${className}`.trim()}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

/* =============================================================================
   CHECKBOX
   ============================================================================= */
export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className={`flex cursor-pointer items-center gap-3 ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="h-5 w-5 rounded border-ink/20 text-forest focus:ring-forest/20"
          {...props}
        />
        <span className="text-sm text-ink">{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/* =============================================================================
   FORM ACTIONS (Submit/Cancel buttons container)
   ============================================================================= */
export interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

export function FormActions({ children, className = '' }: FormActionsProps) {
  return (
    <div className={`flex items-center gap-3 pt-4 ${className}`}>{children}</div>
  );
}
