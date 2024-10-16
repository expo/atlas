// @ts-expect-error
import AsteriskIcon from 'lucide-react/dist/esm/icons/asterisk';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/Tooltip';

type BundleFileSizeProps = {
  /** The size of the files or bundle, in bytes */
  byteSize: number;
};

export function FileSize(props: BundleFileSizeProps) {
  return (
    <div className="inline-flex flex-row items-start text-wrap">
      {formatByteSize(props.byteSize)}
      <Tooltip>
        <TooltipTrigger className="group">
          <AsteriskIcon
            className="hover:color-info group-data-[state=delayed-open]:color-info group-data-[state=instant-open]:color-info"
            size={12}
          />
        </TooltipTrigger>
        <TooltipContent className="border-info text-quaternary shadow-md">
          <p className="mb-2">
            All file sizes are calculated based on the transpiled JavaScript byte size.
          </p>
          <p>
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
    </div>
  );
}

/**
 * Format files or bundle size, from bytes to the nearest unit.
 * This uses the decimal system with a scaling factor of `1000`.
 */
export function formatByteSize(byteSize: number, scalingFactor = 1000) {
  if (byteSize < scalingFactor) {
    return byteSize + 'B';
  } else if (byteSize < scalingFactor * scalingFactor) {
    return (byteSize / scalingFactor).toFixed(1) + 'KB';
  } else {
    return (byteSize / scalingFactor / scalingFactor).toFixed(1) + 'MB';
  }
}
