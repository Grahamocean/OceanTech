import { Link, useLocation, useParams } from "react-router-dom";
import Icon from "../components/ui/Icon";

const pageDetails: Record<
  string,
  { eyebrow: string; title: string; description: string }
> = {
  "/shop": {
    eyebrow: "The collection",
    title: "Find your next essential.",
    description:
      "We're preparing the OceanTech catalogue. Soon, you'll be able to browse products, compare options, and discover your next setup.",
  },
  "/wishlist": {
    eyebrow: "Your saved collection",
    title: "Keep what you love.",
    description:
      "Your wishlist will let you save products and return to them whenever you're ready.",
  },
  "/cart": {
    eyebrow: "Your selection",
    title: "Your bag, your choice.",
    description: "Products you add to your shopping bag will appear here.",
  },
  "/checkout": {
    eyebrow: "Almost yours",
    title: "Let's make it yours.",
    description:
      "The checkout experience will be available once the shopping cart is connected.",
  },
  "/order-confirmation": {
    eyebrow: "Order status",
    title: "Your order details.",
    description:
      "Order confirmation details will appear here after checkout is implemented.",
  },
  "/about": {
    eyebrow: "Our philosophy",
    title: "Technology, thoughtfully chosen.",
    description:
      "OceanTech is built around a simple idea: good technology should make everyday life work better.",
  },
};

export default function PlaceholderPage() {
  const location = useLocation();
  const { slug } = useParams();

  const isProductPage = location.pathname.startsWith("/product/");
  const isNotFound = !pageDetails[location.pathname] && !isProductPage;

  const page = isProductPage
    ? {
        eyebrow: "Product details",
        title: slug ? slug.replace(/-/g, " ") : "Discover the product",
        description:
          "Product images, specifications, availability, and pricing will appear here once the catalogue is connected.",
      }
    : isNotFound
      ? {
          eyebrow: "404 — Page not found",
          title: "This page went elsewhere.",
          description:
            "The page you're looking for doesn't exist or may have moved.",
        }
      : pageDetails[location.pathname];

  return (
    <section className="container-shell flex min-h-[65vh] flex-col justify-center py-20 sm:py-28">
      <p className="eyebrow mb-6">{page.eyebrow}</p>

      <h1 className="display-heading max-w-4xl capitalize">{page.title}</h1>

      <p className="mt-7 max-w-lg text-sm leading-7 text-[#92969E] sm:text-base">
        {page.description}
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link to="/shop" className="button-primary">
          Explore the shop
          <Icon name="arrow-right" size={17} />
        </Link>

        <Link to="/" className="button-secondary">
          Back to home
        </Link>
      </div>
    </section>
  );
}
