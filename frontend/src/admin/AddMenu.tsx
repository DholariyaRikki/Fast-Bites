import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Search, Filter, ChevronDown, IndianRupee, Clock, Package2, Coffee } from "lucide-react";
import React, { FormEvent, useState, useEffect } from "react";
import EditMenu from "./EditMenu";
import { MenuFormSchema, menuSchema } from "@/schema/menuSchema";
import { useMenuStore } from "@/store/useMenuStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Textarea from "@/components/ui/textarea";

const AddMenu = () => {
  const [input, setInput] = useState<MenuFormSchema>({
    name: "",
    description: "",
    price: 0,
    image: undefined,
  });
  const [open, setOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [selectedMenu, setSelectedMenu] = useState<any>();
  const [error, setError] = useState<Partial<MenuFormSchema>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const { loading, createMenu, deleteMenu, updateMenuAvailability } = useMenuStore();
  const { restaurant, getRestaurant } = useRestaurantStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch restaurant data on component mount and after menu changes
  useEffect(() => {
    getRestaurant();
  }, [getRestaurant]);

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setInput({ ...input, [name]: type === "number" ? Number(value) : value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput({ ...input, image: file });
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = menuSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors = result.error.formErrors.fieldErrors;
      setError(fieldErrors as Partial<MenuFormSchema>);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", input.name);
      formData.append("description", input.description);
      formData.append("price", input.price.toString());
      if (input.image) {
        formData.append("image", input.image);
      }
      await createMenu(formData);
      // Reset form and close dialog after successful creation
      setInput({
        name: "",
        description: "",
        price: 0,
        image: undefined,
      });
      setPreviewImage(null);
      setError({});
      setOpen(false);
      // Fetch updated restaurant data
      await getRestaurant();
    } catch (error) {
      console.error("Error creating menu:", error);
    }
  };

  const handleDelete = async (menuId: string) => {
    try {
      await deleteMenu(menuId);
      setDeleteDialogOpen(false);
      // Fetch updated restaurant data
      await getRestaurant();
    } catch (error) {
      console.error("Error deleting menu:", error);
    }
  };

  // Filter and sort menus
  const filteredMenus = restaurant?.menus
    ? restaurant.menus.filter((menu: any) => {
        // Filter by search query
        const matchesSearch = 
          menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          menu.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Filter by category (if 'all' is selected, include all items)
        return activeTab === "all" ? matchesSearch : matchesSearch;
      })
    : [];

  // Sort the filtered menus
  const sortedMenus = [...filteredMenus].sort((a: any, b: any) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Get restaurant stats
  const totalMenuItems = restaurant?.menus?.length || 0;
  const totalMenuValue = restaurant?.menus?.reduce((total: number, menu: any) => total + menu.price, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center">
          <Coffee className="mr-2 text-orange h-8 w-8" />
          Menu Management
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Create, edit and manage your restaurant menu items. Organize your offerings and keep them up to date.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-orange/5 to-orange/10 border border-orange/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-orange/10 p-3 rounded-full mr-4">
                <Package2 className="h-6 w-6 text-orange" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Menu Items</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalMenuItems}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-500/10 p-3 rounded-full mr-4">
                <IndianRupee className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Menu Value</p>
                <h3 className="text-2xl font-bold text-gray-900">₹{totalMenuValue.toLocaleString()}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-500/10 p-3 rounded-full mr-4">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <h3 className="text-md font-bold text-gray-900">
                  {restaurant?.menus?.length > 0 
                    ? new Date(restaurant.menus[0].updatedAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'No items yet'}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="relative md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full border-gray-200"
          />
        </div>
        
        <div className="flex gap-3 items-center ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-gray-200">
                <Filter size={16} />
                Sort by
                <ChevronDown size={16} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSortBy("newest")}>
                Newest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-low")}>
                Price: Low to High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-high")}>
                Price: High to Low
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-asc")}>
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-desc")}>
                Name (Z-A)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange hover:bg-hoverOrange text-white flex items-center gap-2">
                <Plus size={18} />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Add New Menu Item</DialogTitle>
                <DialogDescription>
                  Create a menu item that will make your restaurant stand out.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submitHandler} className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold" htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    value={input.name}
                    onChange={changeEventHandler}
                    placeholder="e.g. Masala Dosa"
                    className="border-gray-300"
                  />
                  {error.name && (
                    <span className="text-xs font-medium text-red-600">
                      {error.name}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold" htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={input.description}
                    onChange={changeEventHandler}
                    placeholder="Describe the ingredients, taste, and other details..."
                    className="border-gray-300 resize-none h-20"
                  />
                  {error.description && (
                    <span className="text-xs font-medium text-red-600">
                      {error.description}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold" htmlFor="price">Price (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                    <Input
                      id="price"
                      type="number"
                      name="price"
                      value={input.price}
                      onChange={changeEventHandler}
                      placeholder="199"
                      className="border-gray-300 pl-10"
                    />
                  </div>
                  {error.price && (
                    <span className="text-xs font-medium text-red-600">
                      {error.price}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold" htmlFor="image">Item Image</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {previewImage ? (
                      <div className="relative">
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="h-40 mx-auto object-cover rounded-md"
                        />
                        <Button 
                          type="button"
                          variant="secondary" 
                          size="sm"
                          className="absolute -top-2 -right-2 rounded-full h-6 w-6 p-0"
                          onClick={() => {
                            setPreviewImage(null);
                            setInput({...input, image: undefined});
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Input
                          id="image"
                          type="file"
                          name="image"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <label 
                          htmlFor="image" 
                          className="cursor-pointer flex flex-col items-center justify-center py-4"
                        >
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">Click to upload an image</p>
                          <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 5MB</p>
                        </label>
                      </>
                    )}
                  </div>
                  {error.image && (
                    <span className="text-xs font-medium text-red-600">
                      {typeof error.image === 'string' ? error.image : 'Invalid image file'}
                    </span>
                  )}
                </div>
                
                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    className="border-gray-300"
                  >
                    Cancel
                  </Button>
                  {loading ? (
                    <Button disabled className="bg-orange hover:bg-hoverOrange">
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Saving...
                    </Button>
                  ) : (
                    <Button type="submit" className="bg-orange hover:bg-hoverOrange">
                      Save Item
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <CardContent className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : sortedMenus.length === 0 ? (
          // Empty state
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Coffee className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No menu items yet</h3>
            <p className="text-gray-500 max-w-md mb-6">
              {searchQuery ? 
                `No items match your search "${searchQuery}". Try a different search term.` : 
                "You haven't added any menu items yet. Add your first item to get started."}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setOpen(true)}
                className="bg-orange hover:bg-hoverOrange text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Item
              </Button>
            )}
          </div>
        ) : (
          // Menu items list
          sortedMenus.map((menu: any) => (
            <Card key={menu._id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={menu.image}
                  alt={menu.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium shadow-sm">
                    <IndianRupee className="h-3 w-3 mr-1" />
                    {menu.price}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5">
                <div className="flex flex-col space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange transition-colors">
                      {menu.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {menu.description}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Added {new Date(menu.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedMenu(menu);
                          setEditOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-gray-300 hover:border-orange hover:text-orange"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          updateMenuAvailability(menu._id, !menu.isAvailable);
                        }}
                        size="sm"
                        variant={menu.isAvailable ? "outline" : "default"}
                        className={`h-8 text-xs ${
                          menu.isAvailable
                            ? "border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        {menu.isAvailable ? "Available" : "Unavailable"}
                      </Button>
                      <Button
                        onClick={() => {
                          setMenuToDelete(menu._id);
                          setDeleteDialogOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Menu Dialog */}
      <EditMenu
        selectedMenu={selectedMenu}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-600">Delete Menu Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this menu item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => menuToDelete && handleDelete(menuToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Item"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddMenu;
