import { BrowserRouter, Route, Routes } from "react-router-dom";

import SiteLayout from "./components/layout/SiteLayout";

import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentCallbackPage from "./pages/PaymentCallbackPage";
import PlaceholderPage from "./pages/PlaceholderPage";

import VerifyEmailPage from "./pages/VerifyEmailPage";
import SignupPage from "./pages/SignupPage";
import SignupSuccessPage from "./pages/SignupSuccessPage";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />

          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />

          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="payment/callback" element={<PaymentCallbackPage />} />

          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="signup/success" element={<SignupSuccessPage />} />

          <Route path="account" element={<AccountPage />} />

          <Route path="wishlist" element={<PlaceholderPage />} />
          <Route path="order-confirmation" element={<PlaceholderPage />} />
          <Route path="about" element={<PlaceholderPage />} />

          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
