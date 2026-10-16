import "dotenv/config";
import { pool } from "./server/db";

async function main() {
  try {
    const result = await pool.query(`
      SELECT slug, name, price_kobo, stock_quantity, is_active
      FROM products
      ORDER BY slug
    `);

    console.table(result.rows);
    console.log("Total products:", result.rowCount);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
