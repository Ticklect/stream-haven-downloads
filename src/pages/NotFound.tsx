import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-8">Oops! Page not found</p>
        <Button 
          onClick={() => navigate('/')}
          className="bg-[#E50914] hover:bg-[#B20710] text-white"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
