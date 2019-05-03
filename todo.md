# in no particular order:
1. There's an XML markup error that appears in the JS console in the browser whenever a login attempt occurs. Identify the issue and fix it.
2. Limit username length to something like 30 characters
3. Limit password to 72 characters (maximum the hash algo allows for)
4. Going to the player page wont always authorize you, sometimes you need to go to the homepage and hit the auth button. This shouldn't be the case
5. Chat log still not persistent, should keep messages for three hours.
6. Does not automaticaly play songs from the queue if the queue was empty when the room was joined. It only plays music when you join a room with music in it.
7. Rename the liveChat folder to 'server'. Hoping doing so wouldn't destroy it.
