import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  isLiked: boolean;
  count: number;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function LikeButton({
  isLiked,
  count,
  onClick,
  disabled = false,
  size = "md",
  showCount = true,
  className,
}: LikeButtonProps) {
  const [animate, setAnimate] = useState(false);
  const [prevLiked, setPrevLiked] = useState(isLiked);

  useEffect(() => {
    // Detect changes to trigger animation
    if (isLiked && !prevLiked) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    }
    setPrevLiked(isLiked);
  }, [isLiked, prevLiked]);

  // Size mappings
  const sizeClasses = {
    sm: {
      button: "h-7 w-7",
      icon: "w-4 h-4",
      ping: "w-5 h-5",
      text: "text-xs",
      container: "gap-1",
    },
    md: {
      button: "h-9 w-9",
      icon: "w-5 h-5",
      ping: "w-7 h-7",
      text: "text-sm",
      container: "gap-1.5",
    },
    lg: {
      button: "h-11 w-11",
      icon: "w-6 h-6",
      ping: "w-8 h-8",
      text: "text-base",
      container: "gap-2",
    },
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!disabled) {
      onClick(e);
    }
  };

  return (
    <div className={cn("flex items-center", sizeClasses[size].container, className)}>
      <div className="relative">
        <Button
          type="button"
          variant={isLiked ? "destructive" : "outline"}
          size="icon"
          onClick={handleClick}
          className={cn(
            sizeClasses[size].button,
            "p-0 relative overflow-hidden transition-all duration-300 rounded-full",
            isLiked
              ? "bg-red-500 hover:bg-red-600 border-red-500 shadow-md"
              : "hover:bg-gray-50 dark:hover:bg-gray-800",
            disabled && "opacity-70 cursor-not-allowed"
          )}
          disabled={disabled}
          title={disabled ? "Log in to like" : isLiked ? "Unlike" : "Like"}
        >
          <Heart
            className={cn(
              sizeClasses[size].icon,
              "transition-all duration-300",
              isLiked ? "fill-white scale-110" : "scale-100",
              animate && "animate-heartbeat",
              disabled ? "opacity-60" : "opacity-100"
            )}
          />
        </Button>
        
        {/* Ping Effect */}
        {isLiked && animate && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className={cn(
                "absolute animate-ping rounded-full bg-red-300 opacity-40",
                sizeClasses[size].ping
              )}
            ></span>
          </span>
        )}
        
        {/* Floating Hearts Animation */}
        {animate && (
          <div className="absolute -top-4 inset-x-0 pointer-events-none flex justify-center">
            {[...Array(3)].map((_, index) => (
              <Heart 
                key={index}
                className={cn(
                  "absolute text-red-500 fill-red-500 opacity-0",
                  sizeClasses[size].icon,
                  `animate-float-${index + 1}`
                )} 
              />
            ))}
          </div>
        )}
      </div>
      
      {showCount && (
        <span
          className={cn(
            sizeClasses[size].text,
            "font-medium transition-all duration-300",
            isLiked ? "text-red-500" : "text-gray-600 dark:text-gray-300"
          )}
        >
          {count > 0 ? (count === 1 ? "1 like" : `${count} likes`) : "0 likes"}
        </span>
      )}
    </div>
  );
} 