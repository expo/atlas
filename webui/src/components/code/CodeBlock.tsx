import { type ComponentProps, type PropsWithChildren } from 'react';

import { Button } from '~/ui/Button';

export function CodeBlockTitle({ children }: PropsWithChildren) {
  return <h3 className="text-md select-none font-medium truncate">{children}</h3>;
}

export function CodeBlockButton(props: ComponentProps<typeof Button>) {
  return (
    <Button variant="quaternary" className="m-0 border-l border-default rounded-none" {...props} />
  );
}

export function CodeBlockHeader({ children }: PropsWithChildren) {
  return (
    <div className="flex justify-between items-center bg-default min-h-[40px] pl-4 border-b border-default">
      {typeof children === 'string' ? <CodeBlockTitle>{children}</CodeBlockTitle> : children}
    </div>
  );
}

export function CodeBlockContent({ children }: { children: string }) {
  return (
    <div
      className="overflow-x-auto h-full text-xs leading-6 py-2 whitespace-pre"
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}
