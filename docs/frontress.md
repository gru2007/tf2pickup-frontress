# Frontress extension

The fork accepts already-formed, roleless Team Frontress games from a trusted
gateway. It does not replace the Steam Lobby queue and does not use tf2pickup's
class-slot queue for these games.

Set `FRONTRESS_GATEWAY_SECRET` to enable the private API. Requests authenticate
with `Authorization: secret <value>`.

## API

```text
POST /api/frontress/v1/games
GET  /api/frontress/v1/games/:externalMatchId
POST /api/frontress/v1/games/:externalMatchId/players
POST /api/frontress/v1/ratings
GET  /api/frontress/v1/players/:steamId/active-game
```

Game creation is idempotent on `externalMatchId`, backed by a unique MongoDB
index. After insertion, the normal tf2pickup server assignment, serveme
reservation, Source log receiver, result handling, history and cleanup run.
Created/configuring Frontress games are resumed after an application restart.

Frontress uses a separate `elo.frontress` rating key without adding a fake
entry to the runtime `Tf2ClassName` enum. This is important because that enum
also defines the real class slots in the upstream queue.

The Frontress RCON branch sends `tf_mm_match_begin` and `tf_mm_match_add` through
tf2pickup's existing retry and connection lifecycle. An unmodified server falls
back to a passworded map; a Team Frontress server acknowledges roster updates.

`SERVEME_TF_SERVER_BOOT_TIMEOUT_SECONDS` defaults to 180 because container
reservations often exceed the upstream serveme client's 30-second default.
Final SDR addresses are returned to players while RCON continues to use the
server's real address. Provisional SDR values are ignored until serveme marks
them final.

`FRONTRESS_IDLE_END_SECONDS` defaults to 300 and ends a started game after its
server remains empty. `FRONTRESS_MAX_MATCH_SECONDS` defaults to 10800 and caps
the full game lifecycle so failed reservations cannot leak indefinitely.
