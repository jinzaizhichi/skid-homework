import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  formatShortcutLabel,
  buildShortcutFromKeyboardEvent,
} from "@/utils/shortcuts";
import { useTranslation } from "react-i18next";

export interface ShortcutRecorderProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ShortcutRecorder({
  value,
  onChange,
}: ShortcutRecorderProps) {
  const { t } = useTranslation("commons");
  const [recording, setRecording] = useState(false);
  const recordingLabel = t("settings-page.shortcuts.recording");
  const unassignedLabel = t("settings-page.shortcuts.unassigned");
  const clearLabel = t("settings-page.shortcuts.clear");

  useEffect(() => {
    if (!recording) return;

    const handleKeyUp = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        setRecording(false);
        return;
      }

      const combo = buildShortcutFromKeyboardEvent(event);
      if (!combo) return;

      onChange(combo);
      setRecording(false);
    };

    window.addEventListener("keyup", handleKeyUp, { capture: true });
    return () =>
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
  }, [recording, onChange]);

  const label = formatShortcutLabel(value);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:items-center">
      <Button
        type="button"
        variant={recording ? "destructive" : "outline"}
        onKeyDown={(e) => {
          // Prevent back to main page when recording
          if (recording) e.stopPropagation();
        }}
        onClick={() => {
          setRecording((prev) => !prev);
        }}
      >
        {recording ? recordingLabel : label || unassignedLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          onChange("");
        }}
        disabled={!value}
      >
        {clearLabel}
      </Button>
    </div>
  );
}
