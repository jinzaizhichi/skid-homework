"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export type ShareAISourceDialogProps = {
  open: boolean;
  onOpenChangeAction: (state: boolean) => void;
  url: string;
};

export default function ShareAISourceDialog({
  open,
  onOpenChangeAction: onOpenChange,
  url,
}: ShareAISourceDialogProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { t } = useTranslation("commons", {
    keyPrefix: "settings-page.sources.share.dialog",
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("desc")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-6 py-4">
          {/* QR Code Container */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <QRCode
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={url}
              viewBox={`0 0 256 256`}
            />
          </div>

          {/* Copy Link Section */}
          <div className="grid w-full gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="link"
                value={url}
                readOnly
                className="h-9 font-mono text-xs"
              />
              <Button
                type="submit"
                size="sm"
                className="px-3"
                variant="secondary"
                onClick={handleCopy}
              >
                <span className="sr-only">{t("copy")}</span>
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
