-- Flat shipping fee (The Courier Guy, anywhere in South Africa), charged on
-- every order. The rate lives in PricingSetting so it can change without a
-- deploy; each order keeps the fee it was charged.

-- Existing orders were charged no shipping, so they stay at 0 and their
-- totalPrice (now "items + shipping") is unchanged.
ALTER TABLE "Order" ADD COLUMN "shippingFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

INSERT INTO "PricingSetting" ("id", "key", "value", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'SHIPPING_FLAT_FEE', 69.99, NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;
