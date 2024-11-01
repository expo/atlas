import type { AtlasModule, PartialAtlasBundle } from 'expo-atlas';
// @ts-expect-error
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down';
import { type ComponentProps, useState, useRef, useLayoutEffect } from 'react';

import { ModuleReferenceList } from './ModuleReferenceList';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/ui/Collapsible';
import { cva, cn } from '~/utils/classname';

type ModuleReferenceProps = {
  bundle: PartialAtlasBundle;
  module: AtlasModule;
  className?: string;
};

export function ModuleReference(props: ModuleReferenceProps) {
  return (
    <div className={cn('lg:grid lg:grid-cols-2', props.className)}>
      <div className="mb-6 lg:mb-0">
        <ModuleReferenceCollapsible
          title="Imported by modules"
          emptyDescription="This module is not imported by other modules."
          bundle={props.bundle}
          moduleRefs={props.module.importedBy}
        />
      </div>
      <div className="mt-6 lg:mt-0">
        <ModuleReferenceCollapsible
          title="Modules imported"
          emptyDescription="This module does not import other modules."
          bundle={props.bundle}
          moduleRefs={props.module.imports}
        />
      </div>
    </div>
  );
}

type ModuleReferenceCollapsibleProps = ComponentProps<typeof ModuleReferenceList> & {
  title: string;
  emptyDescription: string;
};

const collapsibleContentVariants = cva('', {
  variants: {
    variants: {
      overflow: 'overflow-hidden gradient-mask-b-50',
    },
    state: {
      open: '',
      closed: 'max-h-28',
    },
  },
});

function ModuleReferenceCollapsible(props: ModuleReferenceCollapsibleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setOverflowing] = useState(false);
  const [isOpen, setOpen] = useState(!props.moduleRefs.length);

  useLayoutEffect(() => {
    /** Last known overflowing height, used to detect when collapsible is open */
    let knownOverflowHeight: number | null = null;

    const $ref = contentRef.current;
    const detectOverflow = () => {
      if (!$ref) return;

      // Detect overflow only when collapsible is closed
      if ($ref.dataset.state === 'closed') {
        knownOverflowHeight = $ref.offsetHeight;
        setOverflowing($ref.offsetHeight < $ref.scrollHeight);
      } else if (knownOverflowHeight !== null) {
        setOverflowing(knownOverflowHeight < $ref.scrollHeight);
      }
    };

    detectOverflow();
    window.addEventListener('resize', detectOverflow);
    return () => window.removeEventListener('resize', detectOverflow);
  }, [contentRef.current]);

  return (
    <Collapsible open={isOpen} disabled={!isOverflowing} onOpenChange={setOpen}>
      <CollapsibleTrigger>
        <div className="flex flex-row items-center">
          <h3 className="font-semibold mx-2">{props.title}</h3>
          <ChevronDownIcon
            size={18}
            className={cn(
              'text-icon-secondary transition-transform invisible',
              isOverflowing && '!visible',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent
        forceMount
        ref={contentRef}
        className={collapsibleContentVariants({
          state: isOpen ? 'open' : 'closed',
          variants: !isOpen && isOverflowing ? 'overflow' : undefined,
        })}
      >
        <ModuleReferenceList bundle={props.bundle} moduleRefs={props.moduleRefs}>
          <span className="italic text-xs text-secondary">{props.emptyDescription}</span>
        </ModuleReferenceList>
      </CollapsibleContent>
    </Collapsible>
  );
}
