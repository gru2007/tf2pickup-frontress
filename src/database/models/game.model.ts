import type { GameSlotModel } from './game-slot.model'
import type { GameCreated, GameEventModel } from './game-event.model'
import type { Tf2Team } from '../../shared/types/tf2-team'

declare const _gameNumber: unique symbol
export type GameNumber = number & { [_gameNumber]: never }

export enum GameState {
  // the game has been created and is awaiting to be assigned a gameserver
  created = 'created',

  // the game has been assigned a gameserver and it is being configured
  configuring = 'configuring',

  // the gameserver is fully configured and is waiting for the match to start
  launching = 'launching',

  // the match is in progress
  started = 'started',

  // the match has ended
  ended = 'ended',

  // the match has been interrupted by an admin (or another factor)
  interrupted = 'interrupted',
}

export enum GameServerProvider {
  static = 'static',
  servemeTf = 'serveme.tf',
  // https://github.com/sonikro/TF2-QuickServer
  tf2QuickServer = 'tf2quickserver',
}

export enum GameKind {
  pickup = 'pickup',
  frontress = 'frontress',
}

export interface FrontressGame {
  externalMatchId: string
  matchGroup: number
  maxPlayers: number
  serverConfig: string
  matchEmulation: number
}

export interface GameServer {
  id: string
  provider: GameServerProvider
  name: string
  address: string
  port: string

  // if logSecret is undefined, a random one will be assigned automatically
  logSecret?: string

  // set while a tf2QuickServer is still booting (holds the API task ID)
  pendingTaskId?: string

  // SourceTV address/port override (used when STV is on a different host than the game server)
  stvAddress?: string
  stvPort?: number | string

  rcon: {
    address: string
    port: string
    password: string
  }
}

export interface GameModel {
  number: GameNumber
  map: string
  state: GameState
  // Missing on games created before game kinds were introduced; those are pickups.
  kind?: GameKind
  frontress?: FrontressGame

  slots: GameSlotModel[]
  events: [GameCreated, ...GameEventModel[]]
  gameServer?: GameServer

  logsUrl?: string
  demoUrl?: string
  score?: Record<Tf2Team, number>

  logSecret?: string
  // Kept out of the public API. The authenticated Frontress API needs it to
  // hand a configured server back to the game client.
  password?: string
  connectString?: string
  stvConnectString?: string
}
