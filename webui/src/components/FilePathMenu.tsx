// @ts-expect-error
import CheckIcon from 'lucide-react/dist/esm/icons/check';
import { PropsWithChildren, useState, useCallback } from 'react';

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/ui/Menu';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '~/ui/Tooltip';

type FilePath = {
  path: string;
  label?: string;
  copy?: string;
};

type FilePathMenuProps = PropsWithChildren<{
  absolute: FilePath;
  relative: FilePath;
}>;

export function FilePathMenu(props: FilePathMenuProps) {
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);

  const showCopyTooltip = useCallback((content: string) => {
    setTooltipContent(content);
    setTimeout(() => setTooltipContent(null), 2000);
  }, []);

  const onCopyRelativePath = useCallback(() => {
    navigator.clipboard.writeText(props.relative.path);
    showCopyTooltip(props.relative.copy ?? 'Relative path copied');
  }, [props.relative.path, props.relative.copy, showCopyTooltip]);

  const onCopyAbsolutePath = useCallback(() => {
    navigator.clipboard.writeText(props.absolute.path);
    showCopyTooltip(props.absolute.copy ?? 'Absolute path copied');
  }, [props.absolute.path, props.absolute.copy, showCopyTooltip]);

  return (
    <TooltipProvider>
      <Tooltip open={!!tooltipContent}>
        <ContextMenu>
          <TooltipTrigger asChild>
            <ContextMenuTrigger>{props.children}</ContextMenuTrigger>
          </TooltipTrigger>
          <TooltipContent className="inline-flex flex-row items-center">
            {tooltipContent}
            <CheckIcon size={14} className="ml-2" />
          </TooltipContent>
          <ContextMenuContent>
            <ContextMenuItem onClick={onCopyRelativePath}>
              {props.relative.label ?? 'Copy relative path'}
            </ContextMenuItem>
            <ContextMenuItem onClick={onCopyAbsolutePath}>
              {props.absolute.label ?? 'Copy absolute path'}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
