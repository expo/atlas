import { cx } from 'class-variance-authority';
import { type PropsWithChildren } from 'react';

export function PanelGroup(props: PropsWithChildren) {
  return (
    <div className="grid gri-cols-2 auto-rows-fr md:grid-cols-2 md:auto-rows-auto">
      {props.children}
    </div>
  );
}

export function Panel(props: PropsWithChildren) {
  return (
    <div
      className={cx(
        'flex flex-col border-secondary bg-subtle border overflow-hidden',
        'first:rounded-t-md last:rounded-b-md',
        'md:border-r-0 md:last:border md:first:rounded-r-none md:first:rounded-l-md md:last:rounded-l-none md:last:rounded-r-md'
      )}
    >
      {props.children}
    </div>
  );
}
