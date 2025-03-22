import { useEffect, useState } from "react";
import { currentUser } from "../api/auth";

const useSession = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await currentUser();
        setUser(data);
      } catch (error) {
        setUser(null); // No autenticado
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};

export default useSession;