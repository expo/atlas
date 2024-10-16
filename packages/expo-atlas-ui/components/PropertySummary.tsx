import { cx } from 'class-variance-authority';
import { Children, ReactNode, type PropsWithChildren } from 'react';

/**
 * Render various properties or attributes of a certain entity.
 * This renders each of these properties with a separator in between.
 */
export function PropertySummary(
  props: PropsWithChildren<{ className?: string; prefix?: ReactNode }>
) {
  return (
    <div
      className={cx(
        'inline-flex items-center font-sm text-secondary gap-2 text-nowrap',
        props.className
      )}
    >
      {props.prefix}
      {Children.map(props.children, (child, index) => {
        if (index === 0) return child;
        if (!child) return null;
        return (
          <>
            <span className="text-tertiary select-none">-</span>
            {child}
          </>
        );
      })}
    </div>
  );
}
