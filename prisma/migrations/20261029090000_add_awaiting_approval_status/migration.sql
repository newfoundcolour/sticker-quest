-- Kept on its own: Postgres won't let a newly added enum value be used in the
-- same transaction that adds it.
ALTER TYPE "OrderStatus" ADD VALUE 'AWAITING_APPROVAL' BEFORE 'APPROVED';
