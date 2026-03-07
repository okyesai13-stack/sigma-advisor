import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// The advisor chat is now embedded in the AppLayout left panel.
// This page redirects to the dashboard.
const AdvisorNoAuth = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);
  return null;
};

export default AdvisorNoAuth;
