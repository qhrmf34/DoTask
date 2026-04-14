import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, resolveUrl } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full bg-gray-100', sizeMap[size], className)}
    >
      {src && (
        <AvatarPrimitive.Image
          src={resolveUrl(src) ?? src}
          alt={alt ?? ''}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-primary-100 text-primary-600 font-semibold">
        {fallback?.[0]?.toUpperCase() ?? '?'}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
