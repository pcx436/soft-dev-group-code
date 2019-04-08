-- Used for creating the rooms for music. Not sure if this is exactly what we need.
-- mainly using this for testing at the moment but it will be fleshed out eventually


DROP TABLE IF EXISTS rooms;

CREATE TABLE rooms (
 rid UUID UNIQUE NOT NULL,
 r_name TEXT NOT NULL PRIMARY KEY,
 songs TEXT[50][3]
);

-- songs is a 2-D array which can hold 50 songs and holds the song ID, number of votes,
-- and time in which it was added

INSERT INTO rooms(rid, r_name)
 VALUES (gen_random_uuid(), 'Eldora'), (gen_random_uuid(), 'Winter Park'), (gen_random_uuid(), 'A-Basin'), (gen_random_uuid(), 'Copper Mountain'), (gen_random_uuid(), 'Vail Resorts');

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

