import React from 'react';
import styles from './button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'flattened' | 'icon';

type ButtonElement = React.ElementType;

type PolymorphicProps<E extends ButtonElement> = {
  as?: E;
  children: React.ReactNode;
  variant?: ButtonVariant;
  centerLabel?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
} & Omit<
  React.ComponentPropsWithoutRef<E>,
  'children' | 'className' | 'onClick' | 'disabled' | 'type'
>;

export const Button = <E extends ButtonElement = 'button'>(
  props: PolymorphicProps<E>
) => {
  const {
    as,
    children,
    variant = 'primary',
    centerLabel = false,
    onClick,
    disabled = false,
    type = 'button',
    className = '',
    leftIcon,
    rightIcon,
    ...rest
  } = props;

  const Component = (as || 'button') as ButtonElement;

  const baseClass = styles.button;
  const variantClass = styles[`button--${variant}`];
  const centeredClass = centerLabel ? styles['button--label-centered'] : '';
  const buttonClasses = [baseClass, variantClass, centeredClass, className]
    .filter(Boolean)
    .join(' ')
    .trim();

  const componentProps: Record<string, unknown> = {
    className: buttonClasses,
    onClick,
    ...rest,
  };

  if (Component === 'button') {
    componentProps.type = type;
    componentProps.disabled = disabled;
  }

  return (
    <Component {...componentProps}>
      {leftIcon ? (
        <span className={styles['button__icon-left']}>{leftIcon}</span>
      ) : null}
      <span className={styles['button__label']}>{children}</span>
      {rightIcon ? (
        <span className={styles['button__icon-right']}>{rightIcon}</span>
      ) : null}
    </Component>
  );
};
