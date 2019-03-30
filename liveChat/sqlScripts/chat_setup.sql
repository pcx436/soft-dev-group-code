-- WARNING: This script should only be run AFTER the db_create.sql script has been run.
-- This should be run with the command 'sudo -u postgres psql -d mountain_db -f chat_setup.sql'


-- each message contains the following:
-- room_id: UUID of the room in which this message was said
-- t_stamp: timestamp (date & time to 2 decimal precision)
-- body: the contents of the message
-- who_said: UUID of the account that said the message

DROP TABLE IF EXISTS chat_log;

CREATE TABLE chat_log (
 rid UUID NOT NULL,
 t_stamp timestamp (2) with time zone NOT NULL PRIMARY KEY,
 body TEXT NOT NULL,
 who_said UUID NOT NULL
);


-- automatic timestamp insertion functionality
-- also checks if user exists and room exists
CREATE OR REPLACE FUNCTION addStamp()
 RETURNS trigger AS
$BODY$
DECLARE
 u_exist boolean := EXISTS(SELECT username FROM users WHERE uid = NEW.who_said);
 r_exist boolean := EXISTS(SELECT r_name FROM rooms WHERE rid = NEW.rid);
BEGIN
 IF u_exist IS TRUE AND r_exist IS TRUE THEN
  NEW.t_stamp = CURRENT_TIMESTAMP(2);

  RETURN NEW;

 ELSIF u_exist IS TRUE THEN
  RAISE EXCEPTION 'Invalid room identifier: %', NEW.rid;

 ELSIF r_exist IS TRUE THEN
  RAISE EXCEPTION 'Invalid user identifier: %', NEW.who_said;

 ELSE
  RAISE EXCEPTION 'Invalid user (%) and room (%) identifiers.', NEW.who_said, NEW.rid;

 END IF;
END;
$BODY$

LANGUAGE plpgsql VOLATILE
COST 100;

-- installing addStamp trigger
DROP TRIGGER IF EXISTS addStamp ON chat_log;
CREATE TRIGGER validateAndStamp
 BEFORE INSERT OR UPDATE
 ON chat_log
 FOR EACH ROW
 EXECUTE PROCEDURE addStamp();
-- end automatic functionality

-- inserting test messages
INSERT INTO chat_log(rid, body, who_said)
 VALUES (getrid('Eldora'), 'Message 1', getuid('iAmBob'));

-- ADD THE FOLLOWING TWO MANUALLY! Since timestamp is the primary key, there cannot be duplicates
-- duplicates occur when running them all together in a script.
/*INSERT INTO chat_log(rid, body, who_said)
 VALUES (getrid('Eldora'), 'Message 2', getuid('thomasTheTank'));

INSERT INTO chat_log(rid, body, who_said)
 VALUES (getrid('Eldora'), 'Message 3', getuid('iAmBob'));*/

SELECT * FROM chat_log;