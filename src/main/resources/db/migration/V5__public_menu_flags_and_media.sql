ALTER TABLE menu_items
    ADD COLUMN featured BIT(1) NOT NULL DEFAULT b'0' AFTER active,
    ADD COLUMN promotional BIT(1) NOT NULL DEFAULT b'0' AFTER featured;
