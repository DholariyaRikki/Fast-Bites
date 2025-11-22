import React from 'react';
import { Star } from 'lucide-react';
import StarRating from './star-rating';

interface Review {
    _id: string;
    user: {
        _id: string;
        fullname: string;
        profilePicture?: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
}

interface ReviewItemProps {
    review: Review;
    className?: string;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review, className = '' }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {review.user.profilePicture ? (
                        <img
                            src={review.user.profilePicture}
                            alt={review.user.fullname}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                                {review.user.fullname.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div>
                        <h4 className="font-medium text-gray-900">{review.user.fullname}</h4>
                        <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                    </div>
                </div>
                <StarRating 
                    rating={review.rating} 
                    readonly={true}
                    size="md"
                    className="flex-shrink-0"
                />
            </div>
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>
    );
};

export default ReviewItem;