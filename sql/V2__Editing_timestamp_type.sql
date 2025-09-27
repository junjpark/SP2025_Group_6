ALTER TABLE annotations
ALTER COLUMN "timestamp" TYPE INTEGER
USING (EXTRACT(EPOCH FROM "timestamp"))::integer;

ALTER TABLE dance_moves
ALTER COLUMN "timestamp_start" TYPE INTEGER
USING (EXTRACT(EPOCH FROM timestamp_start))::integer;

AlTER TABLE dance_moves
ALTER COLUMN "timestamp_end" TYPE INTEGER
USING (EXTRACT(EPOCH FROM timestamp_end))::integer;