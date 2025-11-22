import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ 
    rating, 
    onRatingChange, 
    readonly = false, 
    size = 'md',
    className = '' 
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const handleClick = (starRating: number) => {
        if (!readonly && onRatingChange) {
            onRatingChange(starRating);
        }
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${sizeClasses[size]} transition-colors duration-200 ${
                        star <= rating 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300 hover:text-yellow-400'
                    } ${!readonly ? 'cursor-pointer' : ''}`}
                    onClick={() => handleClick(star)}
                />
            ))}
            {!readonly && (
                <span className="ml-2 text-sm text-gray-600">
                    {rating}/5
                </span>
            )}
        </div>
    );
};

export default StarRating;