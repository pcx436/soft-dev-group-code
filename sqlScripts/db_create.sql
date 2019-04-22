-- This PostgreSQL script is designed to create the user/password database for the project.
-- It includes creating of the database, users table, and an automatic password hashing routine.
-- It also adds a test user, iAmBob, adds a password, and changes his password.

-- used for hash security
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- drop users table and associated triggers
DROP TRIGGER IF EXISTS inserthash ON users;
DROP TRIGGER IF EXISTS insertNewUser ON users;
DROP TRIGGER IF EXISTS updateHash ON users;
DROP TABLE IF EXISTS users;

-- add table
CREATE TABLE users (
 uid UUID NOT NULL DEFAULT gen_random_uuid(),
 email TEXT NOT NULL UNIQUE,
 username TEXT NOT NULL PRIMARY KEY UNIQUE,
 hash TEXT NOT NULL,
 current_room UUID,
 sock_id TEXT DEFAULT 'a',
 refresh TEXT
);

-- Begin automatic hashing content
-- Automatic hash replacement function
CREATE OR REPLACE FUNCTION autoHash()
  RETURNS trigger AS
$BODY$
DECLARE
 sal TEXT := gen_salt('bf');
BEGIN
 NEW.hash = crypt(NEW.hash, sal);
 
 RETURN NEW;
END;
$BODY$

LANGUAGE plpgsql VOLATILE
COST 100;

-- installing the autohashing trigger for insertion
DROP TRIGGER IF EXISTS insertNewUser ON users;
CREATE TRIGGER insertNewUser
  BEFORE INSERT
  ON users
  FOR EACH ROW
  EXECUTE PROCEDURE autoHash();

-- installing the autohashing trigger for updates ONLY WHEN HASH CHANGES!
DROP TRIGGER IF EXISTS updateHash ON users;
CREATE TRIGGER updateHash
  BEFORE UPDATE
  ON users
  FOR EACH ROW
  WHEN (OLD.hash IS DISTINCT FROM NEW.hash)
  EXECUTE PROCEDURE autoHash();
-- end automatic hashing content

-- done creating stuff, time to insert
INSERT INTO users(email, username, hash)
 VALUES('bob@example.com', 'iAmBob', 'rwvzyJs7');

-- showing results of prior insertion
SELECT * FROM users;

-- testing change password functionality
UPDATE users SET hash='otherPassword' WHERE username='iAmBob';

-- adding in some extra users
INSERT INTO users(email, username, hash)
 VALUES('sally@example.com', 'sally1988', 'beepBoop');

INSERT INTO users(email, username, hash)
 VALUES('thomas@example.com', 'thomasTheTank', 'thomasWillKillAgain');

INSERT INTO users(email, username, hash)
 VALUES('jacob@jacob.com', 'jacob', 'jacob');

-- showing change password worked + new users
SELECT * FROM users;


-- creating getuid function
CREATE OR REPLACE FUNCTION getuid(name TEXT)
 RETURNS UUID AS
 $BODY$
 DECLARE
  id UUID := (SELECT uid FROM users WHERE username = name);
 BEGIN
  return id;
 END;
 $BODY$
 LANGUAGE plpgsql;