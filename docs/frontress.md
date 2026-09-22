# Frontress extension

The fork accepts already-formed, roleless Team Frontress games from a trusted
gateway. It does not replace the Steam Lobby queue and does not use tf2pickup's
class-slot queue for these games.

Set `FRONTRESS_GATEWAY_SECRET` to enable the private API. Requests authenticate
with `Authorization: secret <value>`.

## API

```text
POST /api/frontress/v1/games
GET  /api/frontress/v1/games
GET  /api/frontress/v1/games/:externalMatchId
PUT  /api/frontress/v1/games/:externalMatchId/force-end
POST /api/frontress/v1/games/:externalMatchId/players
POST /api/frontress/v1/ratings
GET  /api/frontress/v1/players/:steamId/active-game
```

Game creation is idempotent on `externalMatchId`, backed by a unique MongoDB
index. After insertion, the normal tf2pickup server assignment, serveme
reservation, Source log receiver, result handling, history and cleanup run.
Created/configuring Frontress games are resumed after an application restart.
The collection endpoint lets the gateway hydrate every active match before it
accepts queue traffic. The force-end endpoint is idempotent and is used when
the full provisioning/configuration deadline expires.

Frontress uses a separate `elo.frontress` rating key without adding a fake
entry to the runtime `Tf2ClassName` enum. This is important because that enum
also defines the real class slots in the upstream queue.

The Frontress RCON branch requires explicit `TFMM_MATCH_BEGIN_OK` and
`TFMM_MATCH_ADD_OK` acknowledgements. An old or incorrectly built game server
is rejected instead of silently launching without the roster gate.

Frontress games have no server password. `tf_mm_match_begin` publishes the
lobby that becomes the game server's list of SteamIDs allowed to connect, and
that roster is the door: a matchmaking server may not hold a password at all,
because TF2 turns `tf_mm_servermode` off the moment it sees one -- which would
take the roster gate down with it. `sv_password` is therefore cleared before
the match begins and players are given a connect string without one.

A password is still generated and passed to `tf_mm_match_begin` as the value
the game server falls back on if it cannot raise the gate. Nobody is told it,
so that failure locks the server rather than opening it, and configuration
fails because the `TFMM_MATCH_BEGIN_OK` acknowledgement does not arrive.

Backfill requests are stored as pending admissions before RCON. Positive ACKs
atomically materialize their slots; a startup/periodic worker retries pending
admissions, making response loss and process crashes safe.

`SERVEME_TF_SERVER_BOOT_TIMEOUT_SECONDS` defaults to 180 because container
reservations often exceed the upstream serveme client's 30-second default.
Final SDR addresses are returned to players while RCON continues to use the
server's real address. Provisional SDR values are ignored until serveme marks
them final.

`FRONTRESS_IDLE_END_SECONDS` defaults to 300 and ends a started game after its
server remains empty. `FRONTRESS_MAX_MATCH_SECONDS` defaults to 10800 and caps
the full game lifecycle so failed reservations cannot leak indefinitely.

Frontress reservations use `externalMatchId` as ServeMe's `match_id`. ServeMe
returns the existing non-terminal reservation for retries, so one match cannot
provision two containers after a lost response or process restart.
