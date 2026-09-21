# Frontress extension

The fork accepts already-formed, roleless Team Frontress games from the trusted
Game Coordinator. Party, queue and lobby state use Valve GC protobufs; this
service owns the durable game, ratings and server reservation lifecycle.

Set `FRONTRESS_GATEWAY_SECRET` to enable the private API. Requests authenticate
with `Authorization: secret <value>`.

## API

```text
POST /api/frontress/v1/games
GET  /api/frontress/v1/games
GET  /api/frontress/v1/games/:externalMatchId
PUT  /api/frontress/v1/games/:externalMatchId/force-end
POST /api/frontress/v1/games/:externalMatchId/players
POST /api/frontress/v1/games/:externalMatchId/result
POST /api/frontress/v1/ratings
GET  /api/frontress/v1/players/:steamId/active-game
```

Game creation is idempotent on `externalMatchId`, backed by a unique MongoDB
index. After insertion, the normal tf2pickup server assignment, serveme
reservation, history and cleanup run.
Created/configuring Frontress games are resumed after an application restart.
The collection endpoint lets the gateway hydrate every active match before it
accepts queue traffic. The force-end endpoint is idempotent and is used when
the full provisioning/configuration deadline expires. The result endpoint is
also idempotent: the dedicated game's native `CMsgGC_Match_Result` reaches the
gateway, which persists the score here before acknowledging the GC job.

Frontress uses a separate `elo.frontress` rating key without adding a fake
entry to the runtime `Tf2ClassName` enum. This is important because that enum
also defines the real class slots in the upstream queue.

Backfill requests are stored as pending admissions and atomically materialize
their slots. The updated roster then travels to the dedicated server through
its native game-server lobby shared object; no custom RCON matchmaking command
or sidecar agent is involved.

`SERVEME_TF_SERVER_BOOT_TIMEOUT_SECONDS` defaults to 180 because container
reservations often exceed the upstream serveme client's 30-second default.
Final SDR addresses are returned to players. Provisional SDR values are ignored
until serveme marks them final.

`FRONTRESS_IDLE_END_SECONDS` defaults to 300 and ends a started game after its
server remains empty. `FRONTRESS_MAX_MATCH_SECONDS` defaults to 10800 and caps
the full game lifecycle so failed reservations cannot leak indefinitely.

Frontress reservations use `externalMatchId` as ServeMe's `match_id`. ServeMe
returns the existing non-terminal reservation for retries, so one match cannot
provision two containers after a lost response or process restart.
