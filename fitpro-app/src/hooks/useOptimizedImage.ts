import { useState, useEffect } from 'react';

interface UseOptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
}

export function useOptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  quality = 75,
  priority = false
}: UseOptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [imageSrc, setImageSrc] = useState(priority ? src : '');

  useEffect(() => {
    if (!priority) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setImageSrc(src);
            observer.disconnect();
          }
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1
        }
      );

      const imgElement = document.createElement('img');
      observer.observe(imgElement);

      return () => observer.disconnect();
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    // Fallback para imagem quebrada
    setImageSrc('/placeholder-image.png');
  };

  return {
    src: imageSrc,
    alt,
    width,
    height,
    quality,
    priority,
    isLoaded,
    isInView,
    onLoad: handleLoad,
    onError: handleError,
    className: `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`
  };
}

// Hook para debounce de inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para virtualização de listas grandes
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount, items.length);

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
} 