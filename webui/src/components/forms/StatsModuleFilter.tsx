import { type FormEvent, useState } from 'react';

import { useModuleFilterContext, useModuleFilterReducer } from '~/providers/modules';
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

export function StatsModuleFilter() {
  const { filters, setFilters } = useModuleFilterContext();
  // NOTE(cedric): keep a duplicate data store to avoid spamming the API with every change
  const [formData, setFormData] = useModuleFilterReducer(filters);
  // NOTE(cedric): we want to programmatically close the dialog when the form is submitted, so make it controlled
  const [dialogOpen, setDialogOpen] = useState(false);

  function onFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    // copy form data
    setFilters({
      // @ts-expect-error
      exclude: event.currentTarget.elements.filterExclude.value ?? undefined,
      // @ts-expect-error
      include: event.currentTarget.elements.filterInclude.value ?? undefined,
    });

    setDialogOpen(false);
  }

  function onDialogChange(isOpen: boolean) {
    setDialogOpen(isOpen);
    if (!isOpen) setFormData(filters);
  }

  return (
    <Sheet open={dialogOpen} onOpenChange={onDialogChange}>
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
          <fieldset className="flex my-4 mt-8">
            <Label className="flex-1 whitespace-nowrap" htmlFor="filter-node_modules">
              Show <span className="font-bold">node_modules</span>
            </Label>
            <Checkbox
              id="filter-node_modules"
              checked={formData.types.includes('node_modules')}
              name=""
              onCheckedChange={(isChecked) => {
                setFormData(
                  isChecked ? { types: ['project', 'node_modules'] } : { types: ['project'] }
                );
              }}
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
              placeholder="e.g. app/**/*.{ts}"
              value={formData.include}
              onChange={(event) => setFormData({ include: event.currentTarget.value })}
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
              placeholder="e.g. react-native/**"
              value={formData.exclude}
              onChange={(event) => setFormData({ exclude: event.currentTarget.value })}
            />
          </fieldset>

          <div className="mt-[25px] flex justify-between">
            <Button variant="quaternary" onClick={() => onDialogChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Apply filters
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
