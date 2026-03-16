import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}

export function ImageLightbox({ open, onOpenChange, src, alt }: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:hidden">
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute -top-10 right-0 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[70vh] w-auto rounded-xl object-contain"
          />
          {alt && (
            <p className="mt-3 text-sm text-white/90 font-medium text-center">{alt}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
