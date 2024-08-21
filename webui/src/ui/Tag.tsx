import { cva, type VariantProps } from 'class-variance-authority';
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
        ios: 'bg-palette-blue3 text-palette-blue11',
        android: 'bg-palette-green3 text-palette-green11',
      },
      environment: {
        // Platform-specific variants
        node: 'bg-palette-orange3 text-palette-orange11',
        client: 'bg-palette-blue3 text-palette-blue11',
        'react-server': 'bg-palette-green3 text-palette-green11',
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

const platformChildren: Record<'android' | 'ios' | 'web', string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
};

const envChildren: Record<'client' | 'node' | 'react-server', string> = {
  client: 'Client',
  node: 'SSR',
  'react-server': 'RSC',
};

type TagProps = ComponentProps<'span'> & VariantProps<typeof tagVariants>;

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, environment, size, children, ...props }, ref) => {
    if (variant && variant in platformChildren) {
      children = platformChildren[variant as keyof typeof platformChildren];
    }

    const isDefaultEnvironment = !environment || environment === 'client';

    return (
      <>
        {!isDefaultEnvironment && (
          <span
            className={tagVariants({ variant, environment, size, className })}
            ref={ref}
            {...props}
          >
            {envChildren[environment] || environment}
          </span>
        )}
        <span
          className={tagVariants({ variant, environment, size, className })}
          ref={ref}
          {...props}
        >
          {children}
        </span>
      </>
    );
  }
);
Tag.displayName = 'Tag';
