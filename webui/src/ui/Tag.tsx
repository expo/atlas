import { cva, type VariantProps } from 'class-variance-authority';
import cn from 'classnames';
import { type ComponentProps, forwardRef } from 'react';

const tagVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold',
  {
    variants: {
      variant: {
        neutral: 'bg-element text-secondary',
        info: 'bg-info text-info',
        warning: 'bg-warning text-warning',
        danger: 'bg-danger text-danger',
        // Platform-specific variants
        web: 'bg-palette-orange3 text-palette-orange11',
        server: 'bg-palette-orange3 text-palette-orange11',
        ios: 'bg-palette-blue3 text-palette-blue11',
        android: 'bg-palette-green3 text-palette-green11',
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

const platformChildren: Record<'android' | 'ios' | 'server' | 'web', string> = {
  android: 'Android',
  ios: 'iOS',
  server: 'Server',
  web: 'Web',
};

type TagProps = ComponentProps<'span'> & VariantProps<typeof tagVariants>;

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    if (variant && variant in platformChildren) {
      children = platformChildren[variant as keyof typeof platformChildren];
    }

    return (
      <span className={cn(tagVariants({ variant, size }), className)} ref={ref} {...props}>
        {children}
      </span>
    );
  }
);
Tag.displayName = 'Tag';
