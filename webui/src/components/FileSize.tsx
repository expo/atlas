// @ts-expect-error
import AsteriskIcon from 'lucide-react/dist/esm/icons/asterisk';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/ui/Tooltip';

type BundleFileSizeProps = {
  /** The size of the files or bundle, in bytes */
  byteSize: number;
};

export function FileSize(props: BundleFileSizeProps) {
  return (
    <div className="inline-flex flex-row items-start">
      {formatByteSize(props.byteSize)}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger className="group">
            <AsteriskIcon
              className="hover:color-info group-data-[state=delayed-open]:color-info group-data-[state=instant-open]:color-info"
              size={12}
            />
          </TooltipTrigger>
          <TooltipContent className="py-2 px-3 max-w-80 bg-screen border-2 border-info rounded-md text-quaternary leading-6 shadow-md">
            <p className="mb-2">
              All file sizes are calculated based on the transpiled JavaScript byte size.
            </p>
            <p className="">
              While these sizes might differ from actual bundle size when using{' '}
              <a
                className="text-link hover:underline"
                href="https://github.com/facebook/hermes/blob/main/doc/Design.md"
                target="_blank"
              >
                Hermes Bytecode (HBC)
              </a>
              , the relative proportions are still correct.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

/** Format files or bundle size, from bytes to the nearest unit */
export function formatByteSize(size: number) {
  if (size < 1024) {
    return size + 'B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + 'KB';
  } else {
    return (size / 1024 / 1024).toFixed(1) + 'MB';
  }
}
