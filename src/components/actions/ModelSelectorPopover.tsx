import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
import { type AiModelSummary, useAiStore } from "@/store/ai-store";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export default function ModelSelectorPopover() {
  const { t: tCommon } = useTranslation("commons");

  const sources = useAiStore((s) => s.sources);
  const activeSourceId = useAiStore((s) => s.activeSourceId);
  const updateSource = useAiStore((s) => s.updateSource);
  const getClientForSource = useAiStore((s) => s.getClientForSource);

  const activeSource = useMemo(
    () => sources.find((source) => source.id === activeSourceId) ?? sources[0],
    [sources, activeSourceId],
  );

  const [availableModels, setAvailableModels] = useState<AiModelSummary[]>([]);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchModels = async () => {
      if (!activeSource?.id || !activeSource.apiKey) {
        if (!cancelled) setAvailableModels([]);
        return;
      }
      try {
        const client = getClientForSource(activeSource.id);
        if (!client?.getAvailableModels) {
          if (!cancelled) setAvailableModels([]);
          return;
        }
        const models = await client.getAvailableModels();
        if (!cancelled) setAvailableModels(models);
      } catch (error) {
        console.error("Failed to fetch models", error);
        if (!cancelled) setAvailableModels([]);
      }
    };

    void fetchModels();

    return () => {
      cancelled = true;
    };
  }, [activeSource, getClientForSource]);

  const handleModelSelect = (model: string) => {
    if (!activeSource) return;
    updateSource(activeSource.id, { model });
    setModelPopoverOpen(false);
  };

  const modelDisplay = useMemo(() => {
    if (!activeSource) return "";
    if (!activeSource.model) return tCommon("settings-page.model.sel.none");
    const match = availableModels.find(
      (model) => model.name === activeSource.model,
    );
    return match ? match.displayName : activeSource.model;
  }, [activeSource, availableModels, tCommon]);

  return (
    <Popover open={modelPopoverOpen} onOpenChange={setModelPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={modelPopoverOpen}
          className="w-full justify-between"
        >
          {modelDisplay}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command>
          <CommandInput
            placeholder={tCommon("settings-page.model.sel.search")}
          />
          <CommandList>
            <CommandEmpty>
              {tCommon("settings-page.model.sel.empty")}
            </CommandEmpty>
            <CommandGroup>
              {availableModels.map((model) => (
                <CommandItem
                  key={model.name}
                  value={model.name}
                  onSelect={(currentValue) => {
                    handleModelSelect(
                      currentValue === activeSource?.model ? "" : currentValue,
                    );
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeSource?.model === model.name
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {model.displayName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
