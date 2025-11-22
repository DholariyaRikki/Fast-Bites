import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MenuFormSchema, menuSchema } from "@/schema/menuSchema";
import { useMenuStore } from "@/store/useMenuStore";
import { MenuItem } from "@/types/restaurantType";
import { Loader2, IndianRupee } from "lucide-react";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import Textarea from "@/components/ui/textarea";
import { useRestaurantStore } from "@/store/useRestaurantStore";

const EditMenu = ({
  selectedMenu,
  editOpen,
  setEditOpen,
}: {
  selectedMenu: MenuItem;
  editOpen: boolean;
  setEditOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [input, setInput] = useState<MenuFormSchema>({
    name: "",
    description: "",
    price: 0,
    image: undefined,
  });
  const [isAvailable, setIsAvailable] = useState<boolean>(selectedMenu?.isAvailable ?? true);
  const [error, setError] = useState<Partial<MenuFormSchema>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { loading, editMenu } = useMenuStore();
  const { getRestaurant } = useRestaurantStore();

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
     
    // API call to edit the menu
    try {
      const formData = new FormData();
      formData.append("name", input.name);
      formData.append("description", input.description);
      formData.append("price", input.price.toString());
      if(input.image){
        formData.append("image", input.image);
      }
      await editMenu(selectedMenu._id, formData);
      setEditOpen(false);
      
      // Reset after successful edit
      setPreviewImage(null);
      
      // Refresh menu data
      await getRestaurant();
    } catch (error) {
      console.error("Error editing menu:", error);
    }
  };

  useEffect(() => {
    setInput({
      name: selectedMenu?.name || "",
      description: selectedMenu?.description || "",
      price: selectedMenu?.price || 0,
      image: undefined,
    });
    setIsAvailable(selectedMenu?.isAvailable ?? true);
    
    // Set preview image if available from selected menu
    if (selectedMenu?.image) {
      setPreviewImage(selectedMenu.image);
    } else {
      setPreviewImage(null);
    }
  }, [selectedMenu]);

  return (
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Menu Item</DialogTitle>
          <DialogDescription>
            Update your menu to keep your offerings fresh and exciting!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitHandler} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold" htmlFor="edit-name">Item Name</Label>
            <Input
              id="edit-name"
              type="text"
              name="name"
              value={input.name}
              onChange={changeEventHandler}
              placeholder="e.g. Masala Dosa"
              className="border-gray-300"
            />
            {error.name && <span className="text-xs font-medium text-red-600">{error.name}</span>}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-semibold" htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              value={input.description}
              onChange={changeEventHandler}
              placeholder="Describe the ingredients, taste, and other details..."
              className="border-gray-300 resize-none h-20"
            />
            {error.description && <span className="text-xs font-medium text-red-600">{error.description}</span>}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-semibold" htmlFor="edit-price">Price (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
              <Input
                id="edit-price"
                type="number"
                name="price"
                value={input.price}
                onChange={changeEventHandler}
                placeholder="199"
                className="border-gray-300 pl-10"
              />
            </div>
            {error.price && <span className="text-xs font-medium text-red-600">{error.price}</span>}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-semibold" htmlFor="edit-image">Item Image</Label>
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
                    id="edit-image"
                    type="file"
                    name="image"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="edit-image" 
                    className="cursor-pointer flex flex-col items-center justify-center py-4"
                  >
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Click to upload a new image</p>
                    <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 5MB</p>
                  </label>
                </>
              )}
            </div>
            {error.image && <span className="text-xs font-medium text-red-600">{typeof error.image === 'string' ? error.image : 'Invalid image file'}</span>}
            <p className="text-xs text-gray-500 mt-1">Leave empty to keep the current image.</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Availability</Label>
              <Button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                variant={isAvailable ? "default" : "outline"}
                className={`h-8 px-4 ${
                  isAvailable
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {isAvailable ? "Available" : "Unavailable"}
              </Button>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
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
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMenu;
