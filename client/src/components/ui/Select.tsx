import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: (SelectOption | string)[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, className = '', ...rest }, ref) => {
    return (
      <select
        ref={ref}
        {...rest}
        className={`input-field appearance-none bg-no-repeat bg-right pr-10 ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23E85D04' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
          backgroundSize: '1.25rem',
          backgroundPosition: 'right 0.75rem center',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={value} value={value} className="bg-brand-black-soft">
              {label}
            </option>
          );
        })}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select;