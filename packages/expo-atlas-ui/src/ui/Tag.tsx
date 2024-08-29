import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps, forwardRef } from 'react';

const tagVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold',
  {
    variants: {
      variant: {
        none: '',
        neutral: 'bg-element text-secondary',
        info: 'bg-info text-info',
        warning: 'bg-warning text-warning',
        danger: 'bg-danger text-danger',
      },
      size: {
        xs: 'px-3 py-1 text-3xs/4',
        sm: 'px-4 py-1 text-xs',
        md: 'px-4 py-1 text-xs',
        lg: 'px-5 py-1 text-base',
        xl: 'px-5 py-1 text-base',
        xxl: 'px-6 py-1 text-lg',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

type TagProps = ComponentProps<'span'> & VariantProps<typeof tagVariants>;

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <span className={tagVariants({ variant, size, className })} ref={ref} {...props}>
      {children}
    </span>
  )
);

Tag.displayName = 'Tag';
