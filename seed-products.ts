import "dotenv/config";
import { pool } from "./server/db";

const products = [
  {
    slug: "macbook-air-m3",
    name: "MacBook Air 13-inch M3",
    brand: "Apple",
    category: "Laptops",
    description: "Lightweight design. Serious performance. Condition: Brand new.",
    price: 1450000,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "hp-elitebook-840-g8",
    name: "EliteBook 840 G8",
    brand: "HP",
    category: "Laptops",
    description: "A dependable professional workstation. Condition: UK used.",
    price: 580000,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "dell-xps-13",
    name: "XPS 13",
    brand: "Dell",
    category: "Laptops",
    description: "Minimal design. Made for productivity. Condition: UK used.",
    price: 980000,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "macbook-pro-14",
    name: "MacBook Pro 14-inch",
    brand: "Apple",
    category: "Laptops",
    description: "Power for demanding creative workflows. Condition: Brand new.",
    price: 2350000,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "samsung-27-inch-monitor",
    name: "27-inch Full HD Monitor",
    brand: "Samsung",
    category: "Monitors",
    description: "More room for your ideas and workflow. Condition: Brand new.",
    price: 420000,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "lg-ultrawide-monitor",
    name: "UltraWide Monitor",
    brand: "LG",
    category: "Monitors",
    description: "A wider view for focused work. Condition: Brand new.",
    price: 760000,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "iphone-15",
    name: "iPhone 15",
    brand: "Apple",
    category: "Phones",
    description: "Everyday performance in a refined design. Condition: UK used.",
    price: 950000,
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "samsung-galaxy-s24",
    name: "Galaxy S24",
    brand: "Samsung",
    category: "Phones",
    description: "A capable companion for your everyday. Condition: UK used.",
    price: 890000,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "sony-wh1000xm5",
    name: "WH-1000XM5 Headphones",
    brand: "Sony",
    category: "Audio",
    description: "Immersive sound with noise cancellation. Condition: Brand new.",
    price: 480000,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "wireless-headphones",
    name: "Studio Wireless Headphones",
    brand: "Audio",
    category: "Audio",
    description: "Comfortable listening, wherever you go. Condition: Brand new.",
    price: 125000,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "mx-master-wireless-mouse",
    name: "MX Master Wireless Mouse",
    brand: "Logitech",
    category: "Accessories",
    description: "Precision control for your daily workflow. Condition: Brand new.",
    price: 185000,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=85",
  },
  {
    slug: "usb-c-multiport-hub",
    name: "USB-C Multiport Hub",
    brand: "Anker",
    category: "Accessories",
    description: "Connect more. Keep your setup simple. Condition: Brand new.",
    price: 85000,
    image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=85",
  },
];

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const product of products) {
      const priceKobo = String(product.price * 100);

      const existing = await client.query(
        "SELECT id FROM products WHERE slug = $1 LIMIT 1",
        [product.slug],
      );

      if (existing.rows.length > 0) {
        await client.query(
          `
            UPDATE products
            SET name = $1,
                description = $2,
                category = $3,
                brand = $4,
                price_kobo = $5,
                image_url = $6,
                is_active = TRUE,
                updated_at = NOW()
            WHERE id = $7
          `,
          [
            product.name,
            product.description,
            product.category,
            product.brand,
            priceKobo,
            product.image,
            existing.rows[0].id,
          ],
        );
      } else {
        await client.query(
          `
            INSERT INTO products (
              slug,
              name,
              description,
              category,
              brand,
              price_kobo,
              image_url,
              stock_quantity,
              is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 0, TRUE)
          `,
          [
            product.slug,
            product.name,
            product.description,
            product.category,
            product.brand,
            priceKobo,
            product.image,
          ],
        );
      }
    }

    await client.query("COMMIT");
    console.log(`Successfully seeded ${products.length} OceanTech products.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Product seeding failed:", error);
  process.exitCode = 1;
});
