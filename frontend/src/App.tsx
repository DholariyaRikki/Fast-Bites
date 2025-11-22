import Login from "./auth/login";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Signup from "./auth/Signup";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import VerifyEmail from "./auth/VerifyEmail";
import HereSection from "./components/HereSection";
import MainLayout from "./layout/MainLayout";
import Profile from "./components/Profile";
import SearchPage from "./components/SearchPage";
import RestaurantDetail from "./components/RestaurantDetail";
import Cart from "./components/Cart";
import Restaurant from "./admin/Restaurant";
import AddMenu from "./admin/AddMenu";
import Orders from "./admin/Orders";
import Success from "./components/Success";
import { useUserStore } from "./store/useUserStore";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import Loading from "./components/Loading";
import DeliveryBoy from "./admin/DeliveryBoy";
import CustomerSupport from "./components/CustomerSupport";
import SuperAdminUsers from "./admin/SuperAdmin";


const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useUserStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isverified) {
    return <Navigate to="/verify-email" replace />;
  }
  return children;
};

const CustomerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useUserStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.admin) {
    return <Navigate to="/" replace />;
  }
  if (user?.delivery) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AuthenticatedUser = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useUserStore();
  if(isAuthenticated && user?.isverified){
    return <Navigate to="/" replace/>
  }
  return children;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useUserStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user?.admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useUserStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user?.superAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};
const DeliveryRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useUserStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.delivery) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      {
        path: "/",
        element: <HereSection />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/search/:text",
        element: <SearchPage />,
      },
      {
        path: "/restaurant/:id",
        element: <RestaurantDetail />,
      },
      {
        path: "/cart",
        element: (
          <CustomerRoute>
            <Cart />
          </CustomerRoute>
        ),
      },
      {
        path: "/order/status",
        element: (
          <CustomerRoute>
            <Success />
          </CustomerRoute>
        ),
      },
      {
        path: "/customer-support",
        element: (
          <CustomerRoute>
            <CustomerSupport />
          </CustomerRoute>
        ),
      },
      {
        path: "/admin/restaurant",
        element:
        <AdminRoute>
          <Restaurant />
        </AdminRoute>,
      },
      {
        path: "/admin/menu",
        element:
        <AdminRoute>
          <AddMenu />
        </AdminRoute>,
      },
      {
        path: "/admin/orders",
        element:
        <AdminRoute>
          <Orders />
        </AdminRoute>,
      },
      {
        path: "/delivery",
        element: (
          <DeliveryRoute>
            <DeliveryBoy />
          </DeliveryRoute> 
        ),
      },
      {
        path: "/super-admin",
        element: (
          <SuperAdminRoute>
            <SuperAdminUsers />
          </SuperAdminRoute>
        ),
      },
    ],
  },
  {
    path: "/login",
    element:<AuthenticatedUser>
      <Login />
       </AuthenticatedUser>, 
  },
  {
    path: "/signup",
    element:<AuthenticatedUser>
      <Signup />
      </AuthenticatedUser> ,
  },
  {
    path: "/forgot-password",
    element:<ForgotPassword />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />,
  },
  {
    path: "/resetpassword/:token",
    element: <ResetPassword />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmail />,
  },
]);

function App() {
  const {checkAuthentication, isCheckingAuth} = useUserStore();
  useEffect(()=>{
    checkAuthentication();
  },[checkAuthentication])

  if(isCheckingAuth) return <Loading/>
  return (
    <main>
      <RouterProvider router={appRouter}></RouterProvider>
    </main>
  );
}

export default App;
