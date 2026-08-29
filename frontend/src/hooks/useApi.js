import { useState, useCallback } from "react";

/**
 * Custom hook for managing API request state.
 *
 * Handles the common pattern of:
 *   loading → success/error
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(parkingAPI.getAll);
 *
 *   useEffect(() => { execute(); }, []);
 *
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *   return <ParkingGrid slots={data} />;
 */
const useApi = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      const message = err.message || "An unexpected error occurred";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { data, loading, error, execute, clearError, setData };
};

export default useApi;
