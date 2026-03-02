import * as React from "react"
import Image from "next/image"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle, Image as ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react"

const enhancedImageVariants = cva(
  "relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "rounded-md",
        circle: "rounded-full",
        square: "rounded-none",
        card: "rounded-lg shadow-sm",
      },
      size: {
        xs: "w-8 h-8",
        sm: "w-12 h-12",
        default: "w-16 h-16",
        lg: "w-24 h-24",
        xl: "w-32 h-32",
        "2xl": "w-48 h-48",
        full: "w-full h-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement>,
    VariantProps<typeof enhancedImageVariants> {
  src: string
  alt: string
  fallback?: string
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  priority?: boolean
  quality?: number
  sizes?: string
  loading?: "lazy" | "eager"
  onLoad?: () => void
  onError?: () => void
  showLoader?: boolean
  showError?: boolean
  errorIcon?: React.ReactNode
  loaderIcon?: React.ReactNode
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
  objectPosition?: string
}

const EnhancedImage = React.forwardRef<HTMLDivElement, EnhancedImageProps>(
  ({ 
    className, 
    variant, 
    size, 
    src, 
    alt, 
    fallback,
    placeholder = "empty",
    blurDataURL,
    priority = false,
    quality = 75,
    sizes,
    loading = "lazy",
    onLoad,
    onError,
    showLoader = true,
    showError = true,
    errorIcon,
    loaderIcon,
    objectFit = "cover",
    objectPosition = "center",
    ...props 
  }, ref) => {
    const [isLoading, setIsLoading] = React.useState(true)
    const [hasError, setHasError] = React.useState(false)
    const [currentSrc, setCurrentSrc] = React.useState(src)

    // Handle image load
    const handleLoad = () => {
      setIsLoading(false)
      setHasError(false)
      onLoad?.()
    }

    // Handle image error
    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
      
      // Try fallback if available
      if (fallback && currentSrc !== fallback) {
        setCurrentSrc(fallback)
        setIsLoading(true)
        setHasError(false)
        return
      }
      
      onError?.()
    }

    // Reset state when src changes
    React.useEffect(() => {
      setCurrentSrc(src)
      setIsLoading(true)
      setHasError(false)
    }, [src])

    // Generate blur data URL if not provided
    const defaultBlurDataURL = React.useMemo(() => {
      if (blurDataURL) return blurDataURL
      
      // Generate a simple blur placeholder
      const canvas = document.createElement('canvas')
      canvas.width = 8
      canvas.height = 8
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, 8, 8)
      }
      return canvas.toDataURL()
    }, [blurDataURL])

    return (
      <div
        ref={ref}
        className={cn(enhancedImageVariants({ variant, size }), className)}
        {...props}
      >
        {/* Loading State */}
        {isLoading && showLoader && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            {loaderIcon || <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          </div>
        )}

        {/* Error State */}
        {hasError && showError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            {errorIcon || (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
                <span className="text-xs">Failed to load</span>
              </div>
            )}
          </div>
        )}

        {/* Image */}
        {!hasError && (
          <Image
            src={currentSrc}
            alt={alt}
            fill
            className={cn(
              "transition-opacity duration-200",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            style={{
              objectFit,
              objectPosition,
            }}
            placeholder={placeholder}
            blurDataURL={placeholder === "blur" ? defaultBlurDataURL : undefined}
            priority={priority}
            quality={quality}
            sizes={sizes}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    )
  }
)
EnhancedImage.displayName = "EnhancedImage"

// Avatar component
export interface AvatarProps extends Omit<EnhancedImageProps, 'size'> {
  size?: "xs" | "sm" | "default" | "lg" | "xl" | "2xl"
  name?: string
  fallbackText?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    size = "default", 
    name, 
    fallbackText,
    alt,
    ...props 
  }, ref) => {
    const [showFallback, setShowFallback] = React.useState(false)

    const handleError = () => {
      setShowFallback(true)
      props.onError?.()
    }

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    if (showFallback || !props.src) {
      return (
        <div
          ref={ref}
          className={cn(
            enhancedImageVariants({ variant: "circle", size }),
            "bg-primary text-primary-foreground flex items-center justify-center font-medium"
          )}
        >
          {fallbackText || (name ? getInitials(name) : <ImageIcon className="h-4 w-4" />)}
        </div>
      )
    }

    return (
      <EnhancedImage
        ref={ref}
        variant="circle"
        size={size}
        alt={alt || name || "Avatar"}
        onError={handleError}
        {...props}
      />
    )
  }
)
Avatar.displayName = "Avatar"

// Image gallery component
export interface ImageGalleryProps {
  images: Array<{
    src: string
    alt: string
    caption?: string
  }>
  currentIndex: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  currentIndex,
  onIndexChange,
  onClose,
}) => {
  const [isLoading, setIsLoading] = React.useState(true)

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
    onIndexChange(newIndex)
    setIsLoading(true)
  }

  const handleNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
    onIndexChange(newIndex)
    setIsLoading(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') handlePrevious()
    if (e.key === 'ArrowRight') handleNext()
  }

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown as any)
    return () => document.removeEventListener('keydown', handleKeyDown as any)
  }, [currentIndex])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </>
        )}

        {/* Image */}
        <div className="flex items-center justify-center h-full">
          <EnhancedImage
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            variant="square"
            size="full"
            className="max-w-full max-h-full object-contain"
            onLoad={() => setIsLoading(false)}
            showLoader={isLoading}
          />
        </div>

        {/* Caption */}
        {images[currentIndex].caption && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
            <p className="text-sm bg-black/50 px-4 py-2 rounded">
              {images[currentIndex].caption}
            </p>
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  onIndexChange(index)
                  setIsLoading(true)
                }}
                className={cn(
                  "w-16 h-16 rounded overflow-hidden border-2 transition-all",
                  index === currentIndex
                    ? "border-white"
                    : "border-transparent opacity-50 hover:opacity-75"
                )}
              >
                <EnhancedImage
                  src={images[index].src}
                  alt={images[index].alt}
                  variant="square"
                  size="full"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { EnhancedImage, Avatar, ImageGallery, enhancedImageVariants }
