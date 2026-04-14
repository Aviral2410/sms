import React from 'react';

type BasePublicFieldProps = {
  label: string;
  icon?: React.ElementType;
  accent?: string;
};

type PublicFieldInputProps = BasePublicFieldProps &
  React.InputHTMLAttributes<HTMLInputElement> & {
    multiline?: false;
    rows?: never;
  };

type PublicFieldTextareaProps = BasePublicFieldProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true;
    rows?: number;
  };

type PublicFieldProps = PublicFieldInputProps | PublicFieldTextareaProps;

export function PublicField(props: PublicFieldProps) {
  const { label, icon: Icon, accent } = props;
  const sharedStyle = { ['--public-focus' as any]: accent, ...props.style };

  if (props.multiline) {
    const { multiline, rows, label: fieldLabel, ...textareaProps } = props;
    delete (textareaProps as Partial<PublicFieldTextareaProps>).accent;
    delete (textareaProps as Partial<PublicFieldTextareaProps>).icon;
    return (
      <label className="public-label">
        <span>{fieldLabel}</span>
        <textarea
          {...textareaProps}
          rows={rows ?? 5}
          className={`public-input public-input--textarea ${props.className || ''}`.trim()}
          style={sharedStyle}
        />
      </label>
    );
  }

  if (Icon) {
    const { icon, label: fieldLabel, ...inputProps } = props as PublicFieldInputProps;
    delete (inputProps as Partial<PublicFieldInputProps>).accent;
    delete (inputProps as Partial<PublicFieldInputProps>).multiline;
    return (
      <label className="public-label">
        <span>{fieldLabel}</span>
        <div className="public-input-wrap">
          <span className="public-input-icon">
            <Icon size={16} />
          </span>
          <input
            {...inputProps}
            className={`public-input ${props.className || ''}`.trim()}
            style={sharedStyle}
          />
        </div>
      </label>
    );
  }

  const { label: fieldLabel, ...inputProps } = props as PublicFieldInputProps;
  delete (inputProps as Partial<PublicFieldInputProps>).accent;
  delete (inputProps as Partial<PublicFieldInputProps>).multiline;
  return (
    <label className="public-label">
      <span>{fieldLabel}</span>
      <input
        {...inputProps}
        className={`public-input ${props.className || ''}`.trim()}
        style={sharedStyle}
      />
    </label>
  );
}
