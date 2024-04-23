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
    <div className="flex flex-col border-secondary bg-subtle border border-l-0 first:border-l first:rounded-l-md last:rounded-r-md overflow-hidden">
      {props.children}
    </div>
  );
}
