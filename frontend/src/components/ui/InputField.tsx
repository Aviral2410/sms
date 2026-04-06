import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  isTextArea?: boolean;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  value?: any;
  onChange?: (e: any) => void;
  className?: string;
}

const InputField = ({ label, isTextArea, error, className = '', ...props }: InputFieldProps) => {
  const Component = isTextArea ? 'textarea' : 'input';

  return (
    <div className={`field-container ${className}`}>
      <label className="input-label">
        <span className="label-text">{label}</span>
        <Component
          className={`input-base ${error ? 'input-error' : ''}`}
          {...(props as any)}
        />
      </label>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default InputField;
