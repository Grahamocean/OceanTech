import { BrowserRouter, Route, Routes } from "react-router-dom";
import SiteLayout from "./components/layout/SiteLayout";
import HomePage from "./pages/HomePage";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<PlaceholderPage />} />
          <Route path="product/:slug" element={<PlaceholderPage />} />
          <Route path="wishlist" element={<PlaceholderPage />} />
          <Route path="cart" element={<PlaceholderPage />} />
          <Route path="checkout" element={<PlaceholderPage />} />
          <Route path="order-confirmation" element={<PlaceholderPage />} />
          <Route path="about" element={<PlaceholderPage />} />
          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
