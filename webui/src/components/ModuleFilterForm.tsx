import { useRouter } from 'expo-router';
import { type FormEvent, type KeyboardEvent, useState, useCallback } from 'react';

import { Button } from '~/ui/Button';
import { Checkbox } from '~/ui/Checkbox';
import { Input } from '~/ui/Input';
import { Label } from '~/ui/Label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/ui/Sheet';
import { debounce } from '~/utils/debounce';
import { useModuleFilters } from '~/utils/filters';

type ModuleFiltersFormProps = {
  disableNodeModules?: boolean;
};

export function ModuleFiltersForm(props: ModuleFiltersFormProps) {
  const router = useRouter();
  const { filters, filtersEnabled } = useModuleFilters();

  // NOTE(cedric): we want to programmatically close the dialog when the form is submitted, so make it controlled
  const [dialogOpen, setDialogOpen] = useState(false);

  function onFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDialogOpen(false);
  }

  function onInputEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      setDialogOpen(false);
    }
  }

  const onModuleChange = useCallback((withNodeModules: boolean) => {
    router.setParams({
      scope: withNodeModules ? undefined : 'project',
    });
  }, []);

  const onIncludeChange = useCallback(
    debounce((value: string) => {
      router.setParams({ include: value || undefined });
    }, 300),
    []
  );

  const onExcludeChange = useCallback(
    debounce((value: string) => {
      router.setParams({ exclude: value || undefined });
    }, 300),
    []
  );

  const onClearFilters = useCallback(() => {
    setDialogOpen(false);
    router.setParams({
      scope: undefined,
      include: undefined,
      exclude: undefined,
    });
  }, []);

  return (
    <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary">Filter</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter modules</SheetTitle>
          <SheetDescription>
            Filter the graph to show only the modules you want to see.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onFormSubmit} className="border-default border-t my-4">
          <fieldset className={`flex my-4 mt-8 ${props.disableNodeModules ? 'opacity-25' : ''}`}>
            <Label className="flex-1 whitespace-nowrap" htmlFor="filter-node_modules">
              Show <span className="font-bold">node_modules</span>
            </Label>
            <Checkbox
              id="filter-node_modules"
              defaultChecked={filters.scope !== 'project'}
              name="filterNodeModules"
              onCheckedChange={onModuleChange}
              disabled={props.disableNodeModules}
            />
          </fieldset>

          <fieldset className="py-4">
            <Label className="whitespace-nowrap" htmlFor="filter-include">
              File glob to include
            </Label>
            <Input
              id="filter-include"
              name="filterInclude"
              type="text"
              className="mt-2"
              placeholder="e.g. app, index.ts, app/**/index.ts"
              defaultValue={filters.include}
              onChange={(event) => onIncludeChange(event.currentTarget.value)}
              onKeyDown={onInputEnter}
            />
          </fieldset>

          <fieldset className="py-4">
            <Label className="whitespace-nowrap" htmlFor="filter-exclude">
              File glob to exclude
            </Label>
            <Input
              id="filter-exclude"
              name="filterExclude"
              type="text"
              className="mt-2"
              placeholder="e.g. react-native, react-native/*/components"
              defaultValue={filters.exclude}
              onChange={(event) => onExcludeChange(event.currentTarget.value)}
              onKeyDown={onInputEnter}
            />
          </fieldset>

          <div className="mt-[25px] flex justify-between">
            <Button variant="quaternary" type="submit" onClick={() => setDialogOpen(false)}>
              Close filters
            </Button>

            <Button
              variant="secondary"
              type="submit"
              onClick={onClearFilters}
              disabled={!filtersEnabled}
            >
              Clear filters
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
