import { GameState, type GameModel } from '../database/models/game.model'
import { GameEventType } from '../database/models/game-event.model'

export function gameToDto(game: GameModel) {
  const ready = game.state === GameState.launching || game.state === GameState.started
  const initialized = game.events.find(event => event.event === GameEventType.gameServerInitialized)
  const started = game.events.find(event => event.event === GameEventType.gameStarted)
  return {
    game: game.number,
    externalMatchId: game.frontress?.externalMatchId,
    state: game.state,
    map: game.map,
    maxPlayers: game.frontress?.maxPlayers,
    matchGroup: game.frontress?.matchGroup,
    createdAt: game.events[0].at.toISOString(),
    readyAt: initialized?.at.toISOString() ?? null,
    startedAt: started?.at.toISOString() ?? null,
    score: game.score ?? null,
    players: game.slots.map(slot => ({
      steamId: slot.player,
      team: slot.team,
      connectionStatus: slot.connectionStatus,
    })),
    server:
      ready && game.gameServer
        ? {
            connect: `${game.gameServer.address}:${game.gameServer.port}`,
            password: game.password ?? '',
            stv: game.gameServer.stvAddress
              ? `${game.gameServer.stvAddress}:${game.gameServer.stvPort ?? 27020}`
              : null,
          }
        : null,
  }
}
