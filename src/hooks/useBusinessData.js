import { getCustomers, getProducts, getSales } from "../firebase/database";
import useCollection from "./useCollection";
export default function useBusinessData() {
  const customers = useCollection(getCustomers),
    products = useCollection(getProducts),
    sales = useCollection(getSales);
  return {
    customers: customers.data,
    products: products.data,
    sales: sales.data,
    loading: customers.loading || products.loading || sales.loading,
    error: customers.error || products.error || sales.error,
  };
}
