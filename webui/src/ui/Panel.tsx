import { type PropsWithChildren } from 'react';

export function PanelGroup({ children }: PropsWithChildren) {
  return (
    <div className="grid grid-cols-2 auto-rows-fr md:grid-cols-2 md:auto-rows-auto">{children}</div>
  );
}

export function Panel({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col border-default bg-subtle border border-l-0 first:border-l first:rounded-l-md last:rounded-r-md overflow-hidden">
      {children}
    </div>
  );
}
