import { Link } from "react-router-dom";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  Clock,
  Shield,
  Truck,
  HeartHandshake
} from "lucide-react";
import { Separator } from "./ui/separator";
import { useUserStore } from "@/store/useUserStore";

const Footer = () => {
  const { user } = useUserStore();
  const isRegularUser = !user?.admin && !user?.delivery;

  return (
    <footer className="bg-gradient-to-t from-secondary/40 to-background border-t border-border/40">
      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Truck className="w-5 h-5 text-orange" />, title: "Fast Delivery", desc: "Quick doorstep delivery" },
            { icon: <Shield className="w-5 h-5 text-orange" />, title: "Secure Payment", desc: "100% secure transactions" },
            { icon: <HeartHandshake className="w-5 h-5 text-orange" />, title: "Best Quality", desc: "Fresh ingredients daily" },
            { icon: <Clock className="w-5 h-5 text-orange" />, title: "24/7 Support", desc: "Always here to help" },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-4 group transition-all duration-200 hover:bg-background p-4 rounded-xl hover-lift">
              <div className="bg-orange/10 p-3 rounded-full group-hover:bg-orange/20 transition-all duration-200 glass-effect">
                {item.icon}
              </div>
              <div>
                <h3 className="font-medium text-foreground gradient-text">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="opacity-30" />
      
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6 md:col-span-2">
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-bold gradient-text">Fast-Bites</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Delivering delicious food experiences to your doorstep. Quick, reliable, and tasty - that's our promise.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: <Facebook size={18} />, href: "#" },
                { icon: <Instagram size={18} />, href: "#" },
                { icon: <Twitter size={18} />, href: "#" },
                { icon: <Linkedin size={18} />, href: "#" },
              ].map((social, index) => (
                <a 
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-border/40 hover:bg-orange/10 hover:text-orange transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Useful Links</h4>
            <ul className="space-y-3">
              {[
                { text: "Restaurants", link:"/search/all" },
                ...(isRegularUser ? [{ text: "Order", link: "/order/status" }] : []),
                { text: "Profile", link: "/profile" },
                ...(isRegularUser ? [{ text: "Customer Support", link: "/customer-support" }] : []),
              ].map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.link} 
                    className="text-muted-foreground hover:text-orange transition-colors flex items-center gap-2"
                  >
                    <span className="h-1 w-2 bg-orange rounded-full"></span>
                    {item.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Contact Us</h4>
            <ul className="space-y-4">
              {[
                { icon: <Phone size={16} />, text: "+91 9825000000" },
                { icon: <Mail size={16} />, text: "fastbites021648@gmail.com" },
                { icon: <MapPin size={16} />, text: "Tagor-Bhavan-A, Parul University, Vadodara" },
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-muted-foreground">
                  <div className="bg-orange/10 p-2 rounded-full">{item.icon}</div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/40 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Fast-Bites. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {[
                { text: "Privacy Policy", link: "/" },
                { text: "Terms of Service", link: "/" },
                { text: "Shipping Policy", link: "/" },
              ].map((item, index) => (
                <Link
                  key={index}
                  to={item.link}
                  className="text-muted-foreground hover:text-orange transition-colors"
                >
                  {item.text}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;