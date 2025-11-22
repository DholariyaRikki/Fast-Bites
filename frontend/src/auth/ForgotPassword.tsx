import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ForgotPassword = () => {
    const [email, setEmail] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3350/api';

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!email) {
        toast.error("Please enter your email address");
        return;
      }
      
      setLoading(true);
      
      try {
        const response = await fetch(`${API_URL}/user/forgot-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setEmailSent(true);
          toast.success(data.message);
        } else {
          toast.error(data.message || "Failed to send reset link");
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <form className="flex flex-col gap-5 md:p-8 w-full max-w-md rounded-lg mx-4" onSubmit={handleSubmit}>
        <div className="text-center">
          <h1 className="font-extrabold text-2xl mb-2">Forgot Password</h1>
          <p className="text-sm text-gray-600">
            {emailSent 
              ? "Check your email for a reset link" 
              : "Enter your email address to reset your password"}
          </p>
        </div>
        <div className="relative w-full">
            <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="pl-10"
            disabled={emailSent}
            />
            <Mail className="absolute inset-y-2 left-2 text-gray-600 pointer-events-none"/>
        </div>
        {
            loading ? (
                <Button disabled className="bg-orange hover:bg-hoverOrange"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Please wait</Button>
            ) : (
                <Button 
                  type="submit" 
                  className="bg-orange hover:bg-hoverOrange"
                  disabled={emailSent}
                >
                  {emailSent ? "Reset Link Sent" : "Send Reset Link"}
                </Button>
            )
        }
        <span className="text-center">
            Back to{" "}
            <Link to="/login" className="text-blue-500">Login</Link>
        </span>
      </form>
    </div>
  );
};

export default ForgotPassword;