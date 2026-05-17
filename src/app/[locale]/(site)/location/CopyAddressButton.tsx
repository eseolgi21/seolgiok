"use client";

import { useState } from "react";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";

type Props = { address: string; label: string; copiedLabel: string };

export function CopyAddressButton({ address, label, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-hover transition-colors font-medium mt-1"
    >
      <ClipboardDocumentIcon className="w-3.5 h-3.5" />
      {copied ? copiedLabel : label}
    </button>
  );
}
