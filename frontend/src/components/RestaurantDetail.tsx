import { useRestaurantStore } from "@/store/useRestaurantStore";
import AvailableMenu from "./AvailableMenu";
import { Badge } from "./ui/badge";
import { MapPin, Star, Timer, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";
import { LikeButton } from "./ui/like-button";
import { Separator } from "./ui/separator";
import { useReviewStore } from "@/store/useReviewStore";
import ReviewItem from "./ui/review-item";
import ReviewForm from "./ui/review-form";

const RestaurantDetail = () => {
  const params = useParams();
  const { singleRestaurant, getSingleRestaurant, toggleLike } = useRestaurantStore();
  const { user } = useUserStore();
  const {
    restaurantReviews,
    restaurantReviewsLoading,
    createRestaurantReview,
    getRestaurantReviews
  } = useReviewStore();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    getSingleRestaurant(params.id!);
  }, [params.id, getSingleRestaurant]);
  
  useEffect(() => {
    if (singleRestaurant) {
      setIsLiked(singleRestaurant.userHasLiked || false);
      setLikeCount(singleRestaurant.likeCount || 0);
      getRestaurantReviews(params.id!);
    }
  }, [singleRestaurant, params.id, getRestaurantReviews]);

  const handleLike = async (_e: React.MouseEvent) => {
    if (!user) return; // Don't allow liking if not logged in
    await toggleLike(params.id!);
  };

  const handleCreateReview = async (rating: number, comment: string) => {
    await createRestaurantReview(params.id!, rating, comment);
  };

  if (!singleRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Restaurant Header */}
      <div className="w-full">
        <div className="relative w-full h-48 md:h-80 lg:h-96 rounded-3xl overflow-hidden shadow-floating hover-lift">
          <img
            src={singleRestaurant?.imageUrl}
            alt={singleRestaurant?.restaurantname}
            className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 p-6 w-full">
            <div className="flex flex-col gap-2 md:gap-3">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl md:text-4xl text-white gradient-text">
                  {singleRestaurant?.restaurantname}
                </h1>
                <LikeButton
                  isLiked={isLiked}
                  count={likeCount}
                  onClick={handleLike}
                  disabled={!user}
                  size="lg"
                  className="hover:scale-110 transition-transform duration-200"
                />
              </div>
              
              <div className="flex items-center gap-2 text-white/90 flex-wrap">
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full glass-effect">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {singleRestaurant?.city}, {singleRestaurant?.country}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full glass-effect">
                  <Timer className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {singleRestaurant?.deliverytime} mins
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full glass-effect">
                  <User className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {singleRestaurant?.ownerName}
                  </span>
                </div>
                {singleRestaurant?.rating && (
                  <div className="flex items-center gap-1 bg-orange/90 backdrop-blur-sm px-2 py-1 rounded-full glass-effect">
                    <Star className="w-3 h-3 fill-white" />
                    <span className="text-xs font-medium">
                      {singleRestaurant?.rating}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">Cuisines:</h2>
            {singleRestaurant?.cuisines.map((cuisine: string, idx: number) => (
              <Badge key={idx} variant="outline" className="px-3 py-1 bg-secondary font-medium border-secondary">
                {cuisine}
              </Badge>
            ))}
          </div>
          
          {singleRestaurant?.description && (
            <p className="text-muted-foreground mt-4">{singleRestaurant.description}</p>
          )}
        </div>
      </div>
      
      <Separator className="my-8" />
       
      {/* Menu Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">Menu</h2>
        {singleRestaurant?.menus && singleRestaurant.menus.length > 0 ? (
          <AvailableMenu menus={singleRestaurant?.menus} />
        ) : (
          <div className="text-center py-16 bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground">No menu items available at the moment.</p>
          </div>
        )}
      </div>
      
      {/* Reviews Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          {singleRestaurant?.rating && (
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-semibold">{singleRestaurant.rating.toFixed(1)}</span>
              <span className="text-gray-500">({restaurantReviews.length} reviews)</span>
            </div>
          )}
        </div>

        {/* Review Form */}
        {user && (
          <div className="mb-8">
            <ReviewForm onSubmit={handleCreateReview} />
          </div>
        )}

        {/* Reviews List */}
        {restaurantReviewsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange"></div>
          </div>
        ) : restaurantReviews.length > 0 ? (
          <div className="space-y-4">
            {restaurantReviews.map((review) => (
              <ReviewItem key={review._id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground">
              {user ? "Be the first to review this restaurant!" : "Login to write a review"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetail;
