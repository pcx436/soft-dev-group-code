-- This PostgreSQL script is designed to create the user/password database for the project.
-- It includes creating of the database, users table, and an automatic password hashing routine (although this is currently limited to the MD5 algorithm).
-- It also adds a test user, iAmBob, adds a password, and changes his password.


-- dropping and/or creating mUserTest database
DROP DATABASE IF EXISTS mountain_db;
CREATE DATABASE mountain_db;
\c mountain_db

-- used for hash security
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS users;

-- add table
CREATE TABLE users (
 uid UUID UNIQUE NOT NULL,
 email TEXT NOT NULL UNIQUE,
 username TEXT NOT NULL PRIMARY KEY UNIQUE,
 salt TEXT NOT NULL,
 hash TEXT NOT NULL,
 current_room UUID
);

-- Begin automatic hashing content
-- Automatic hash replacement function
CREATE OR REPLACE FUNCTION autoHash()
  RETURNS trigger AS
$BODY$
DECLARE
 sal TEXT := gen_salt('bf');
BEGIN
 NEW.salt = sal;
 NEW.hash = crypt(NEW.hash, sal);
 NEW.uid = gen_random_uuid();
 
 RETURN NEW;
END;
$BODY$

LANGUAGE plpgsql VOLATILE
COST 100;

-- installing the autohashing trigger
DROP TRIGGER IF EXISTS insertHash ON users;
CREATE TRIGGER insertHash
  BEFORE INSERT OR UPDATE
  ON users
  FOR EACH ROW
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