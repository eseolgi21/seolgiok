"use client";

import { useState } from "react";
import Image from "next/image";
import { XMarkIcon, MagnifyingGlassPlusIcon } from "@heroicons/react/24/outline";

type Props = { images: string[]; zoomLabel: string; closeLabel: string };

export function MenuGallery({ images, zoomLabel, closeLabel }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col gap-8">
        {images.map((src, i) => (
          <div
            key={src}
            className="relative group border border-cream-border bg-white overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-gold/40 transition-all"
            onClick={() => setSelected(src)}
          >
            <Image
              src={src}
              alt={`메뉴판 ${i + 1}`}
              width={1200}
              height={900}
              className="w-full h-auto object-contain"
              priority={i === 0}
            />
            <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-dark/90 text-cream px-5 py-3 flex items-center gap-2 text-sm font-medium">
                <MagnifyingGlassPlusIcon className="w-4 h-4" />
                {zoomLabel}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-dark/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-4 right-4 text-cream hover:text-gold transition-colors"
            onClick={() => setSelected(null)}
            aria-label={closeLabel}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
          <div className="max-w-4xl w-full max-h-[92vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selected}
              alt="메뉴판 확대"
              width={1600}
              height={1200}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
