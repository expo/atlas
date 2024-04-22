import * as Select from '@radix-ui/react-select';
import cn from 'classnames';
import { useRouter } from 'expo-router';
// @ts-expect-error
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down';
// @ts-expect-error
import ChevronUpIcon from 'lucide-react/dist/esm/icons/chevron-up';

import { useBundle } from '~/providers/bundle';
import { Button } from '~/ui/Button';
import { Tag } from '~/ui/Tag';
import { relativeBundlePath } from '~/utils/bundle';

export function BundleSelectForm() {
  const router = useRouter();
  const { bundle, bundles } = useBundle();

  return (
    <Select.Root value={bundle.id} onValueChange={(bundle) => router.setParams({ bundle })}>
      <Select.Trigger asChild>
        <Button variant="quaternary" size="sm">
          <Tag variant={bundle.platform} size="xs" className="mr-2" />
          <Select.Value placeholder="Select bundle to inspect" />
          <Select.Icon className="text-icon-default">
            <ChevronDownIcon size={16} className="m-1 mr-0 align-middle" />
          </Select.Icon>
        </Button>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          side="bottom"
          collisionPadding={{ left: 16, right: 16 }}
          className={cn(
            'flex min-w-[220px] flex-col gap-0.5 rounded-md border border-default bg-default p-1 shadow-md',
            'transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
            'data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-1/3 data-[state=open]:fade-in data-[state=open]:slide-in-from-top-1/3'
          )}
        >
          <Select.ScrollUpButton className="SelectScrollButton">
            <ChevronUpIcon />
          </Select.ScrollUpButton>
          <Select.Viewport className="SelectViewport">
            {bundles.map((item) => (
              <div key={item.id}>
                <Select.Item value={item.id} asChild>
                  <Button variant="quaternary" size="sm" className="w-full">
                    <Tag variant={item.platform} className="mr-2" />
                    <Select.ItemText>{relativeBundlePath(item, item.entryPoint)}</Select.ItemText>
                  </Button>
                </Select.Item>
              </div>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="SelectScrollButton">
            <ChevronDownIcon />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
