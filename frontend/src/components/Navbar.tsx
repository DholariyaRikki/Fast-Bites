import { Link, useLocation } from "react-router-dom";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "./ui/menubar";
import { Button } from "./ui/button";
import {
  HandPlatter,
  Loader2,
  Menu,
  PackageCheck,
  ShoppingCart,
  SquareMenu,
  User,
  UtensilsCrossed,
  HeartHandshake,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "./ui/separator";
import { useUserStore } from "@/store/useUserStore";
import { useCartStore } from "@/store/useCartStore";

const MobileNavbar = () => {
  const { user, logout, loading } = useUserStore();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size={"icon"}
          className="rounded-full bg-gray-200 text-black hover:bg-gray-200"
          variant="outline"
        >
          <Menu size={"18"} />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between mt-2">
          <SheetTitle>Fast-Bites</SheetTitle>
        </SheetHeader>
        <Separator className="my-2" />
        <SheetDescription className="flex-1">
          <Link
            to="/"
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
              isActive("/")
                ? "bg-orange/10 text-orange"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            <User />
            <span className="font-medium">Home</span>
          </Link>
          <Link
            to="/search/all"
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
              isActive("/search/all")
                ? "bg-orange/10 text-orange"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="font-medium">Restaurants</span>
          </Link>
          <Link
            to="/profile"
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
              isActive("/profile")
                ? "bg-orange/10 text-orange"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </Link>

          {!user?.admin && !user?.delivery && !user?.superAdmin && (
            <>
              <Link
                to="/order/status"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive("/order/status")
                    ? "bg-orange/10 text-orange"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                <HandPlatter className="w-5 h-5" />
                <span className="font-medium">Order</span>
              </Link>
              <Link
                to="/cart"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive("/cart")
                    ? "bg-orange/10 text-orange"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Cart</span>
              </Link>
            </>
          )}
          {!user?.superAdmin && (
            <>
              
              <Link
                to="/customer-support"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive("/customer-support")
                    ? "bg-orange/10 text-orange"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                <HeartHandshake className="w-5 h-5" />
                <span className="font-medium">Support</span>
              </Link>
            </>
          )}

          {user?.admin && (
            <>
              <Link
                to="/admin/menu"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive("/admin/menu")
                    ? "bg-orange/10 text-orange"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                <SquareMenu className="w-5 h-5" />
                <span className="font-medium">Menu</span>
              </Link>
              <Link
                to="/admin/restaurant"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive("/admin/restaurant")
                    ? "bg-orange/10 text-orange"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                <UtensilsCrossed className="w-5 h-5" />
                <span className="font-medium">Restaurant</span>
              </Link>
              <Link
                to="/admin/orders"
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive("/admin/orders")
                    ? "bg-orange/10 text-orange"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                <PackageCheck className="w-5 h-5" />
                <span className="font-medium">Restaurant Orders</span>
              </Link>
            </>
          )}
          
          {user?.superAdmin && (
            <Link
              to="/super-admin"
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive("/super-admin")
                  ? "bg-orange/10 text-orange"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              <SquareMenu className="w-5 h-5" />
              <span className="font-medium">Super Admin</span>
            </Link>
          )}
        </SheetDescription>
        <SheetFooter className="flex flex-col gap-4 mt-4">
          <div className="flex flex-row items-center gap-2">
            <Avatar className="border-2 border-orange/20">
              <AvatarImage src={user?.profilePicture} />
              <AvatarFallback className="bg-orange/10 text-orange">PF</AvatarFallback>
            </Avatar>
            <h1 className="font-bold text-lg">FAST-BITES</h1>
          </div>
          <SheetClose asChild>
            {loading ? (
              <Button className="w-full bg-orange hover:bg-hoverOrange transition-colors duration-200">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button
                onClick={logout}
                className="w-full bg-orange hover:bg-hoverOrange transition-colors duration-200"
              >
                Logout
              </Button>
            )}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const Navbar = () => {
  const { user, loading, logout } = useUserStore();
  const { cart } = useCartStore();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <div className="fixed top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-smooth">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <h1 className="font-bold md:font-extrabold text-2xl gradient-text group-hover:scale-105 transition-transform duration-300">
                Fast-Bites
              </h1>
            </Link>
            <div className="hidden md:flex items-center gap-10">
              <div className="hidden md:flex items-center gap-6">
                <Link 
                  to="/" 
                  className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive("/") 
                      ? "text-orange" 
                      : "text-gray-600 dark:text-gray-300 hover:text-orange"
                  }`}
                >
                  Home
                  {isActive("/") && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange rounded-full" />
                  )}
                </Link>
                <Link 
                  to="/search/all" 
                  className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive("/search/all") 
                      ? "text-orange" 
                      : "text-gray-600 dark:text-gray-300 hover:text-orange"
                  }`}
                >
                  Restaurants
                  {isActive("/search/all") && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange rounded-full" />
                  )}
                </Link>
                <Link 
                  to="/profile" 
                  className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive("/profile") 
                      ? "text-orange" 
                      : "text-gray-600 dark:text-gray-300 hover:text-orange"
                  }`}
                >
                  Profile
                  {isActive("/profile") && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange rounded-full" />
                  )}
                </Link>
                
                {!user?.admin && !user?.delivery && !user?.superAdmin && (
                  <>
                    <Link 
                      to="/order/status" 
                      className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        isActive("/order/status") 
                          ? "text-orange" 
                          : "text-gray-600 dark:text-gray-300 hover:text-orange"
                      }`}
                    >
                      Order
                      {isActive("/order/status") && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange rounded-full" />
                      )}
                    </Link>
                  </>
                )}
                {!user?.superAdmin && (
                  <>
                    <Link 
                      to="/customer-support" 
                      className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        isActive("/customer-support") 
                          ? "text-orange" 
                          : "text-gray-600 dark:text-gray-300 hover:text-orange"
                      }`}
                    >
                      Support
                      {isActive("/customer-support") && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange rounded-full" />
                      )}
                    </Link>
                  </>
                )}

                {user?.admin ? (
                  <Menubar>
                    <MenubarMenu>
                      <MenubarTrigger className="bg-orange/10 text-orange hover:bg-orange/20 transition-colors duration-200">
                        Dashboard
                      </MenubarTrigger>
                      <MenubarContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                        <Link to="/admin/restaurant">
                          <MenubarItem className="hover:bg-orange/10 hover:text-orange transition-colors duration-200">
                            Restaurant
                          </MenubarItem>
                        </Link>
                        <Link to="/admin/menu">
                          <MenubarItem className="hover:bg-orange/10 hover:text-orange transition-colors duration-200">
                            Menu
                          </MenubarItem>
                        </Link>
                        <Link to="/admin/orders">
                          <MenubarItem className="hover:bg-orange/10 hover:text-orange transition-colors duration-200">
                            Orders
                          </MenubarItem>
                        </Link>
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>
                ) : user?.delivery ? (
                  <Menubar>
                    <MenubarMenu>
                      <MenubarTrigger className="bg-orange/10 text-orange hover:bg-orange/20 transition-colors duration-200">
                        Dashboard
                      </MenubarTrigger>
                      <MenubarContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                        <Link to="/delivery">
                          <MenubarItem className="hover:bg-orange/10 hover:text-orange transition-colors duration-200">
                            Delivery
                          </MenubarItem>
                        </Link>
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>
                ) :user?.superAdmin ? (
                  <Menubar>
                    <MenubarMenu>
                      <MenubarTrigger className="bg-orange/10 text-orange hover:bg-orange/20 transition-colors duration-200">
                        Dashboard
                      </MenubarTrigger>
                      <MenubarContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                        <Link to="/super-admin">
                          <MenubarItem className="hover:bg-orange/10 hover:text-orange transition-colors duration-200">
                            Super Admin
                          </MenubarItem>
                        </Link>
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link to="/cart" className="relative cursor-pointer group">
                      <div className="relative">
                        <ShoppingCart className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-orange transition-colors duration-200" />
                        {cart.length > 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse-slow">
                            {cart.length}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="border-2 border-transparent group-hover:border-orange transition-colors duration-200">
                    <AvatarImage src={user?.profilePicture} alt="profilephoto" />
                    <AvatarFallback className="bg-orange/10 text-orange">PF</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  {loading ? (
                    <Button disabled className="bg-orange hover:bg-hoverOrange transition-colors duration-200">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </Button>
                  ) : (
                    <Button
                      onClick={logout}
                      className="bg-orange hover:bg-hoverOrange transition-colors duration-200"
                    >
                      Logout
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="md:hidden lg:hidden">
              <MobileNavbar />
            </div>
          </div>
        </div>
      </div>
      <div className="pt-16">
        {/* This div will contain the main content */}
      </div>
    </>
  );
};

export default Navbar;
