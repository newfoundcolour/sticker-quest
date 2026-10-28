-- Kept on its own: Postgres won't let a newly added enum value be used (e.g.
-- as a column default) in the same transaction that adds it.
ALTER TYPE "Role" ADD VALUE 'CUSTOMER';
