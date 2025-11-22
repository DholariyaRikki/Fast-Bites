import { MenuItem } from "@/types/restaurantType";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { useCartStore } from "@/store/useCartStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { Loader2, Star, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";


const AvailableMenu = ({ menus }: { menus: MenuItem[] }) => {
  const { addToCart } = useCartStore();
  const { user } = useUserStore();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState("default");
  const navigate = useNavigate();


  const handleAddToCart = async (menu: MenuItem) => {
    setLoading({ ...loading, [menu._id]: true });
    try {
      await addToCart(menu);
      navigate("/cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoading({ ...loading, [menu._id]: false });
    }
  };

  const sortedMenus = [...menus].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="md:p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl md:text-2xl font-extrabold">Available Menus</h1>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name">Name: A to Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {sortedMenus.filter(menu => user?.admin || user?.delivery || user?.superAdmin || menu.isAvailable).map((menu, index) => (
          <Card
            key={menu._id}
            className="w-full max-w-sm mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-100 dark:border-gray-700 animate-fade-in hover-lift"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative w-full h-48">
              <img
                src={menu.image}
                alt={menu.name}
                className="w-full h-full object-cover object-center"
                onError={(e) => { e.currentTarget.src = 'path/to/default/image.jpg'; }}
              />
              {!menu.isAvailable && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge variant="destructive" className="bg-red-600 text-white px-3 py-1 text-sm font-medium">
                    Unavailable
                  </Badge>
                </div>
              )}
              {menu.price > 500 && (
                <Badge className="absolute top-3 right-3 bg-orange hover:bg-hoverOrange px-3 py-1 text-sm animate-pulse-slow">
                  <Star className="w-3.5 h-3.5 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
            <CardHeader className="p-5 pb-2">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight gradient-text">
                {menu.name}
              </h2>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{menu.description}</p>
              <h3 className="text-lg font-bold mt-4 text-gray-800 dark:text-white">
                Price: <span className="text-[#D19254]">₹{menu.price}</span>
              </h3>
            </CardContent>
            <CardFooter className="p-5 pt-0 flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <div>
                    <Button variant="outline" className="flex-1 h-11 text-sm font-medium hover:bg-orange/10 hover:text-orange transition-all duration-200">
                      Quick View
                    </Button>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold gradient-text">{menu.name}</DialogTitle>
                    {!menu.isAvailable && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                          Unavailable
                        </Badge>
                      </div>
                    )}
                  </DialogHeader>
                  <div className="mt-4">
                    <img src={menu.image} alt={menu.name} className="w-full h-72 object-cover rounded-lg shadow-md" />
                    <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">{menu.description}</p>
                    <h3 className="text-2xl font-bold mt-4 text-gray-800 dark:text-white">
                      Price: <span className="text-[#D19254]">₹{menu.price}</span>
                    </h3>
                  </div>
                </DialogContent>
              </Dialog>
              
              {!user?.admin && !user?.delivery && !user?.superAdmin ? (
                menu.isAvailable ? (
                  <Button
                    onClick={() => handleAddToCart(menu)}
                    className="flex-1 h-11 gradient-bg hover:opacity-90 text-white text-sm font-medium transition-all duration-200"
                    disabled={loading[menu._id]}
                  >
                    {loading[menu._id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="flex-1 h-11 bg-gray-300 text-gray-500 text-sm font-medium cursor-not-allowed"
                  >
                    Unavailable
                  </Button>
                )
              ) : null}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AvailableMenu;
