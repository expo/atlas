import { cva, cx, type VariantProps } from 'class-variance-authority';
import { Link } from 'expo-router';
import { type HTMLAttributes, type PropsWithChildren } from 'react';

const layoutVariants = cva('', {
  variants: {
    variant: {
      default: '',
      viewport: 'flex flex-col h-full',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function Layout({
  variant,
  className,
  children,
  ...props
}: PropsWithChildren<VariantProps<typeof layoutVariants> & { className?: string }>) {
  return (
    <main className={layoutVariants({ variant, className })} {...props}>
      {children}
    </main>
  );
}

export function LayoutHeader(props: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cx('flex flex-row justify-between my-6 px-8', props.className)}>
      {props.children}
    </div>
  );
}

export function LayoutTitle(props: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cx('flex flex-row flex-wrap items-center gap-3 min-h-10', props.className)}>
      {props.children}
    </div>
  );
}

export function LayoutNavigation({
  children,
  className,
}: PropsWithChildren & { className?: string }) {
  return (
    <header
      className={cx(
        'h-16 flex flex-shrink-0 items-center justify-between gap-2 border-b border-b-secondary bg-default px-4',
        className
      )}
    >
      <div className="flex flex-row">
        <Link className="mr-4" href="/" aria-label="Go back to graph">
          <ExpoLogoBig title="Expo" className="w-[74px] text-default max-md-gutters:hidden" />
          <ExpoLogoSmall title="Expo" className="hidden text-default max-md-gutters:flex" />
        </Link>
      </div>
      {children}
    </header>
  );
}

function ExpoLogoBig({ className, ...props }: HTMLAttributes<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 71 20"
      fill="none"
      role="img"
      className={cx('icon-md text-default', className)}
      {...props}
    >
      <path
        d="M9.258 6.342c.158-.23.331-.26.472-.26.14 0 .374.03.532.26 2.06 2.806 6.332 10.208 6.727 10.611.585.597 1.388.225 1.854-.452.46-.667.587-1.135.587-1.634 0-.34-6.653-12.614-7.324-13.636C11.462.248 11.252 0 10.15 0h-.825c-1.1 0-1.259.248-1.903 1.23C6.75 2.254.097 14.528.097 14.868c0 .5.127.967.587 1.634.466.677 1.269 1.05 1.854.452.395-.403 4.661-7.805 6.72-10.61zm14.941-5.237v15.344h9.35v-3.113h-6.125v-3.244h5.45V6.98h-5.45V4.218h6.125V1.105h-9.35zM46.25 16.449l-3.88-5.568 3.619-5.195h-3.662L40.54 8.23l-1.765-2.543h-3.706l3.618 5.217-3.857 5.546h3.661l2.027-2.915 2.027 2.915h3.705zm7.572-10.982c-1.482 0-2.637.614-3.378 1.732V5.686H47.37V20h3.073v-5.063c.74 1.117 1.896 1.731 3.378 1.731 2.768 0 4.97-2.52 4.97-5.611 0-3.091-2.202-5.59-4.97-5.59zm-.697 8.242c-1.504 0-2.681-1.14-2.681-2.652 0-1.49 1.177-2.653 2.68-2.653 1.483 0 2.681 1.184 2.681 2.653 0 1.49-1.198 2.652-2.68 2.652zm12.188-8.242c-3.16 0-5.558 2.411-5.558 5.612 0 3.2 2.397 5.59 5.557 5.59 3.139 0 5.558-2.39 5.558-5.59 0-3.2-2.42-5.612-5.558-5.612zm0 2.96c1.438 0 2.55 1.117 2.55 2.652 0 1.49-1.112 2.63-2.55 2.63-1.46 0-2.55-1.14-2.55-2.63 0-1.535 1.09-2.653 2.55-2.653z"
        fill="currentColor"
      />
    </svg>
  );
}

function ExpoLogoSmall({ className, ...props }: HTMLAttributes<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      role="img"
      className={cx('icon-md text-default', className)}
      {...props}
    >
      <path
        d="M9.477 7.638c.164-.24.343-.27.488-.27.145 0 .387.03.551.27 2.13 2.901 6.55 10.56 6.959 10.976.605.618 1.436.233 1.918-.468.475-.69.607-1.174.607-1.69 0-.352-6.883-13.05-7.576-14.106-.667-1.017-.884-1.274-2.025-1.274h-.854c-1.138 0-1.302.257-1.969 1.274C6.883 3.406 0 16.104 0 16.456c0 .517.132 1 .607 1.69.482.7 1.313 1.086 1.918.468.41-.417 4.822-8.075 6.952-10.977z"
        fill="currentColor"
      />
    </svg>
  );
}
