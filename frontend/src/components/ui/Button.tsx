import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  danger: 'button-danger',
  ghost: 'button-ghost',
  link: 'button-link',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: '', // Default size from button classes
  lg: 'px-6 py-4 text-base',
  icon: 'button-icon',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    
    // For icon size, use button-icon class instead of variant
    const baseClass = size === 'icon' ? 'button-icon' : variantClasses[variant];
    const sizeClass = size === 'icon' ? '' : sizeClasses[size];
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseClass} ${sizeClass} ${widthClass} ${className}`.trim()}
        {...props}
      >
        {loading ? (
          <>
            <span className="loading-spinner h-4 w-4" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/* Chip Button Variants */
export interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  active?: boolean;
}

const chipVariantClasses = {
  default: 'button-chip',
  primary: 'button-chip-primary',
  danger: 'button-chip-danger',
};

export const ChipButton = forwardRef<HTMLButtonElement, ChipButtonProps>(
  ({ variant = 'default', active, className = '', children, ...props }, ref) => {
    const variantClass = active ? 'button-chip-primary' : chipVariantClasses[variant];
    
    return (
      <button ref={ref} className={`${variantClass} ${className}`.trim()} {...props}>
        {children}
      </button>
    );
  }
);

ChipButton.displayName = 'ChipButton';

/* Icon Button */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md';
  label: string; // For accessibility
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', label, className = '', children, ...props }, ref) => {
    const sizeClass = size === 'sm' ? 'button-icon-sm' : 'button-icon';
    
    return (
      <button
        ref={ref}
        aria-label={label}
        className={`${sizeClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

/* Counter Button (for +/- quantity) */
export interface CounterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const CounterButton = forwardRef<HTMLButtonElement, CounterButtonProps>(
  ({ label, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={`counter-button ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CounterButton.displayName = 'CounterButton';
