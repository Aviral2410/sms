import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
}

const Button = ({ variant = 'primary', isLoading, children, className = '', ...props }: ButtonProps) => {
  const variantStyles = {
    primary: 'primary-button',
    secondary: 'secondary-button',
    danger: 'danger-button',
    ghost: 'ghost-button',
  };

  return (
    <button
      className={`${variantStyles[variant]} ${className} ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Processing...' : children}
    </button>
  );
};

export default Button;
