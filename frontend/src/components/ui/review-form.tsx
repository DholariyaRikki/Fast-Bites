import React, { useState } from 'react';
import { Button } from './button';
import Textarea from './textarea';
import StarRating from './star-rating';
import { toast } from 'sonner';

interface ReviewFormProps {
    onSubmit: (rating: number, comment: string) => Promise<void>;
    existingReview?: {
        rating: number;
        comment: string;
    };
    isLoading?: boolean;
    className?: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ 
    onSubmit, 
    existingReview, 
    isLoading = false,
    className = '' 
}) => {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        if (comment.trim().length < 10) {
            toast.error('Review must be at least 10 characters long');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment);
            setComment('');
            setRating(0);
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
            <h3 className="text-lg font-semibold mb-4">
                {existingReview ? 'Update Your Review' : 'Write a Review'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Rating
                    </label>
                    <StarRating 
                        rating={rating} 
                        onRatingChange={setRating}
                        size="lg"
                        className="justify-start"
                    />
                </div>

                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review
                    </label>
                    <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                        placeholder="Share your experience..."
                        className="min-h-[100px] resize-none"
                        maxLength={500}
                    />
                    <p className={`text-xs mt-1 ${
                        comment.length > 450 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                        {comment.length}/500 characters
                    </p>
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="w-full"
                >
                    {isSubmitting || isLoading ? 'Submitting...' : 
                     existingReview ? 'Update Review' : 'Submit Review'}
                </Button>
            </form>
        </div>
    );
};

export default ReviewForm;