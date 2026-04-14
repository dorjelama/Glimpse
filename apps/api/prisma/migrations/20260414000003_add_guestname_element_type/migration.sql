-- Migration: add_guestname_element_type
-- Adds 'guestname' to the ElementType enum.

ALTER TYPE "ElementType" ADD VALUE 'guestname';
