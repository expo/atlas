import * as Select from '@radix-ui/react-select';
import { cx } from 'class-variance-authority';
import { useRouter } from 'expo-router';
// @ts-expect-error
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down';

import { BundleTag } from '~/components/BundleTag';
import { useBundle } from '~/providers/bundle';
import { Button } from '~/ui/Button';
import { relativeBundlePath } from '~/utils/bundle';

export function BundleSelectForm() {
  const router = useRouter();
  const { bundle, bundles } = useBundle();

  return (
    <Select.Root value={bundle.id} onValueChange={(bundle) => router.setParams({ bundle })}>
      <Select.Trigger asChild>
        <Button variant="quaternary" size="sm">
          <BundleTag
            className="mr-2"
            size="xs"
            platform={bundle.platform}
            environment={bundle.environment}
          />
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
          className={cx(
            'flex min-w-[220px] flex-col gap-0.5 rounded-md border border-default bg-default p-1 shadow-md',
            'transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
            'data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-1/3 data-[state=open]:fade-in data-[state=open]:slide-in-from-top-1/3'
          )}
        >
          <Select.Viewport className="py-2">
            {bundles.map((item) => (
              <div key={item.id}>
                <Select.Item value={item.id} asChild>
                  <Button variant="quaternary" size="sm" className="w-full !justify-start my-0.5">
                    <BundleTag
                      className="mr-2"
                      size="xs"
                      platform={item.platform}
                      environment={item.environment}
                    />
                    <Select.ItemText>{relativeBundlePath(item, item.entryPoint)}</Select.ItemText>
                  </Button>
                </Select.Item>
              </div>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
