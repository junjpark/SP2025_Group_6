ALTER TABLE annotations
ALTER COLUMN "timestamp" TYPE DOUBLE PRECISION
USING ("timestamp"::double precision);

ALTER TABLE dance_moves
ALTER COLUMN "timestamp_start" TYPE DOUBLE PRECISION
USING ("timestamp_start"::double precision);

ALTER TABLE dance_moves
ALTER COLUMN "timestamp_end" TYPE DOUBLE PRECISION
USING ("timestamp_end"::double precision);
