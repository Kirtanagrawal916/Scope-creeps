import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app")({
  component: ProtectedAppRoute,
});

function ProtectedAppRoute() {
  const nav = useNavigate();
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("scopeguard_user_id");

    if (!userId) {
      nav({ to: "/login" });
      return;
    }

    setIsCheckingLogin(false);
  }, [nav]);

  if (isCheckingLogin) {
    return null;
  }

  return <Outlet />;
}
