import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Textarea from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/store/useUserStore";
import { Loader2 } from "lucide-react";
import axios from "axios";

interface Offer {
  _id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdBy: {
    fullname: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const OfferManagement = () => {
  const { user } = useUserStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
    isActive: true,
  });

  useEffect(() => {
    if (user?.superAdmin) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3350/api/offer`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setOffers(response.data.offers);
      }
    } catch (error: any) {
      console.error("Error fetching offers:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      } else if (error.request) {
        console.error("No response from server. Please make sure the backend is running on port 3350.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
      };

      const url = editingOffer ? `http://localhost:3350/api/offer/${editingOffer._id}` : `http://localhost:3350/api/offer/create`;
      const method = editingOffer ? "PUT" : "POST";

      const response = await axios({
        method,
        url,
        data: payload,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setIsDialogOpen(false);
        setEditingOffer(null);
        resetForm();
        fetchOffers();
      } else {
        throw new Error(response.data.message || "Error saving offer");
      }
    } catch (error: any) {
      console.error("Error saving offer:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        alert(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Request data:", error.request);
        alert("No response from server. Please make sure the backend is running.");
      } else {
        // Something happened in setting up the request that triggered an Error
        alert(error.message || "Error saving offer");
      }
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      code: offer.code,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue.toString(),
      maxDiscountAmount: offer.maxDiscountAmount?.toString() || "",
      minOrderAmount: offer.minOrderAmount?.toString() || "",
      validFrom: new Date(offer.validFrom).toISOString().split("T")[0],
      validUntil: new Date(offer.validUntil).toISOString().split("T")[0],
      usageLimit: offer.usageLimit?.toString() || "",
      isActive: offer.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const response = await axios.delete(`http://localhost:3350/api/offer/${id}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        fetchOffers();
      } else {
        alert(response.data.message || "Error deleting offer");
      }
    } catch (error: any) {
      console.error("Error deleting offer:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        alert(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error("No response from server. Please make sure the backend is running.");
        alert("No response from server. Please make sure the backend is running on port 3350.");
      } else {
        alert(error.message || "Error deleting offer");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      maxDiscountAmount: "",
      minOrderAmount: "",
      validFrom: "",
      validUntil: "",
      usageLimit: "",
      isActive: true,
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingOffer(null);
    resetForm();
  };

  const formatValidDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (user?.superAdmin !== true) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Offer Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>Create New Offer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingOffer ? "Edit Offer" : "Create New Offer"}</DialogTitle>
              <DialogDescription>
                {editingOffer ? "Update the offer details below." : "Create a new offer code for customers."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Offer Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter offer description"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountValue">
                    {formData.discountType === "percentage" ? "Discount (%)" : "Discount Amount"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === "percentage" ? "10" : "100"}
                    min={formData.discountType === "percentage" ? "1" : "1"}
                    max={formData.discountType === "percentage" ? "100" : undefined}
                    required
                  />
                </div>
                {formData.discountType === "percentage" && (
                  <div>
                    <Label htmlFor="maxDiscountAmount">Max Discount Amount (optional)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minOrderAmount">Minimum Order Amount</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    placeholder="100"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="usageLimit">Usage Limit (optional)</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="100"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingOffer ? "Update Offer" : "Create Offer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <Card key={offer._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="font-mono text-lg">{offer.code}</span>
                      <Badge variant={offer.isActive ? "default" : "secondary"}>
                        {offer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{offer.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(offer)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(offer._id)}
                      disabled={offer.usageCount > 0}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Discount:</span>{" "}
                    {offer.discountType === "percentage"
                      ? `${offer.discountValue}%`
                      : `₹${offer.discountValue}`}
                    {offer.maxDiscountAmount && (
                      <span className="text-gray-500 ml-1">
                        (max ₹{offer.maxDiscountAmount})
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Min Order:</span> ₹{offer.minOrderAmount || 0}
                  </div>
                  <div>
                    <span className="font-medium">Valid:</span>{" "}
                    {formatValidDate(offer.validFrom)} - {formatValidDate(offer.validUntil)}
                  </div>
                  <div>
                    <span className="font-medium">Usage:</span> {offer.usageCount}
                    {offer.usageLimit && (
                      <span className="text-gray-500 ml-1">/ {offer.usageLimit}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {offers.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No offers found. Create your first offer!</p>
        </div>
      )}
    </div>
  );
};

export default OfferManagement;