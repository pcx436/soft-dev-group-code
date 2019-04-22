-- Used for creating the rooms for music. Not sure if this is exactly what we need.
-- mainly using this for testing at the moment but it will be fleshed out eventually
DROP TABLE IF EXISTS rooms;

CREATE TABLE rooms (
 rid UUID NOT NULL DEFAULT gen_random_uuid(),
 r_name TEXT NOT NULL PRIMARY KEY
);

INSERT INTO rooms(r_name)
 VALUES ('Eldora'), ('Winter Park'), ('A-Basin'), ('Copper Mountain'), ('Vail Resorts');

-- creating getrid function
CREATE OR REPLACE FUNCTION getrid(name TEXT)
 RETURNS UUID AS
 $BODY$
 DECLARE
  id UUID := (SELECT rid FROM rooms WHERE r_name = name);
 BEGIN
  return id;
 END;
 $BODY$
 LANGUAGE plpgsql;

SELECT * FROM rooms;