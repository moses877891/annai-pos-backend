import { Router } from "express";
import multer from "multer";
import csv from "csv-parser";
import Product from "../models/Product.js";
import { auth } from "../middleware/auth.js";
import fs from "fs";

const router = Router();
const upload = multer({ dest: "uploads/" });

function cleanNumber(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") {
    v = v.trim();
    if (v === "") return null;
  }
  const num = Number(v);
  return isNaN(num) ? null : num;
}

// POST /import/products
router.post("/", auth("admin"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;
  const rows = [];

  // Parse CSV
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      try {
        const grouped = {};

        // Group by product code
        for (const r of rows) {
          const code = Number(r.code);
          if (!grouped[code]) {
            grouped[code] = {
              code,
              name: r.name,
              category: r.category,
              price: cleanNumber(r.basePrice),
              variants: [],
            };
          }

          if (r.variantName) {
            grouped[code].variants.push({
              name: r.variantName,
              price: cleanNumber(r.variantPrice),
            });
          }
        }

        // Convert to array
        const productsToSave = Object.values(grouped);

        let savedCount = 0;

        for (const p of productsToSave) {
          // Check duplicate
          const existing = await Product.findOne({ code: p.code });

          if (existing) {
            // Update existing variants instead of duplicating
            existing.name = p.name;
            existing.category = p.category;
            existing.price = p.price;

            if (p.variants.length > 0) {
              existing.variants = p.variants;
            }

            await existing.save();
          } else {
            await Product.create(p);
          }

          savedCount++;
        }

        fs.unlinkSync(filePath);

        res.json({
          message: "Import completed",
          totalImported: savedCount,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error processing file" });
      }
    });
});

export default router;