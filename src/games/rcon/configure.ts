import { minutesToMilliseconds, secondsToMilliseconds } from 'date-fns'
import { deburr, delay, retry } from 'es-toolkit'
import { configuration } from '../../configuration'
import { collections } from '../../database/collections'
import { GameEventType } from '../../database/models/game-event.model'
import {
  type GameModel,
  type GameNumber,
  GameKind,
  GameServerProvider,
  GameState,
} from '../../database/models/game.model'
import { environment } from '../../environment'
import { logger } from '../../logger'
import { LogsTfUploadMethod } from '../../shared/types/logs-tf-upload-method'
import { generateGameserverPassword } from '../../utils/generate-game-server-password'
import { makeConnectString } from '../make-connect-string'
import { update } from '../update'
import { extractConVarValue } from '../extract-con-var-value'
import { generate } from 'generate-password'
import { events } from '../../events'
import { withRcon } from './with-rcon'
import { verifyLogTransmission } from './verify-log-transmission'
import { servemeTf } from '../../serveme-tf'
import { tf2QuickServer } from '../../tf2-quick-server'
import type { ReservationId } from '@tf2pickup-org/serveme-tf-client'
import { errors } from '../../errors'
import { players } from '../../players'
import type { RconCommand } from '../../shared/types/rcon-command'
import { Tf2Team } from '../../shared/types/tf2-team'

const configurators = new Map<GameNumber, AbortController>()
const configureRetries = 2

export function cancelConfigure(gameNumber: GameNumber) {
  configurators.get(gameNumber)?.abort()
}

export async function configure(gameNumber: GameNumber): Promise<void> {
  cancelConfigure(gameNumber)
  const controller = new AbortController()
  configurators.set(gameNumber, controller)
  let game: GameModel | null = null
  try {
    game = await collections.games.findOne({ number: gameNumber })
    if (!game) throw errors.notFound(`Game #${gameNumber} not found`)
    const timeout = AbortSignal.timeout(await configureTimeout(game))
    const signal = AbortSignal.any([controller.signal, timeout])
    let configureAttempt = 0
    await retry(
      async () => {
        if (configureAttempt++ > 0) {
          game = await collections.games.findOne({ number: gameNumber })
          if (!game) throw errors.notFound(`Game #${gameNumber} not found`)
        }
        await doConfigure(game!, { signal })
      },
      {
        retries: configureRetries,
        delay: secondsToMilliseconds(5),
        signal,
        shouldRetry: (error, attempt) => {
          if (error instanceof Error && 'statusCode' in error) {
            return false
          }
          const willRetry = attempt < configureRetries
          logger.warn(
            { error, attempt: attempt + 1 },
            willRetry
              ? `configure attempt ${attempt + 1} failed for game #${gameNumber}, retrying...`
              : `configure attempt ${attempt + 1} failed for game #${gameNumber}`,
          )
          return willRetry
        },
      },
    )
  } catch (error) {
    logger.error({ error }, `error configuring game #${gameNumber}`)
    if (game) {
      events.emit('game:gameServerConfigureFailed', { game, error })
    }
    try {
      await update(gameNumber, {
        $push: {
          events: {
            event: GameEventType.gameServerConfigureFailed,
            at: new Date(),
            error: error instanceof Error ? error.message : String(error),
          },
        },
      })
    } catch (updateError) {
      logger.error(
        { error: updateError },
        `failed to record configure failure for game #${gameNumber}`,
      )
    }
  } finally {
    configurators.delete(gameNumber)
  }
}

async function configureTimeout(game: GameModel): Promise<number> {
  const configureRconTimeout = minutesToMilliseconds(1)

  if (game.gameServer?.pendingTaskId) {
    return (await configuration.get('tf2_quick_server.timeout')) + configureRconTimeout
  }

  if (game.gameServer?.provider === GameServerProvider.tf2QuickServer) {
    return secondsToMilliseconds(90) + configureRconTimeout
  }

  if (game.gameServer?.provider === GameServerProvider.servemeTf) {
    return (
      secondsToMilliseconds(environment.SERVEME_TF_SERVER_BOOT_TIMEOUT_SECONDS) +
      configureRconTimeout
    )
  }

  return configureRconTimeout
}

async function doConfigure(game: GameModel, options: { signal?: AbortSignal } = {}) {
  if (game.gameServer === undefined) {
    throw errors.badRequest('gameServer is undefined')
  }
  if ([GameState.ended, GameState.interrupted].includes(game.state)) {
    throw errors.conflict('game has already ended')
  }
  logger.info({ game }, `configuring game #${game.number}...`)
  const { signal } = options

  if (game.gameServer.provider === GameServerProvider.servemeTf) {
    const reservation = await servemeTf.waitForStart(Number(game.gameServer.id) as ReservationId)
    const sdr = reservation.sdr
    if (sdr?.final) {
      game = await update(game.number, {
        $set: {
          'gameServer.address': sdr.ip,
          'gameServer.port': sdr.port,
          'gameServer.stvAddress': sdr.ip,
          'gameServer.stvPort': sdr.tvPort,
        },
      })
    }
  }

  if (game.gameServer?.provider === GameServerProvider.tf2QuickServer) {
    if (game.gameServer.pendingTaskId) {
      logger.info(
        { taskId: game.gameServer.pendingTaskId },
        'waiting for TF2 QuickServer to be ready...',
      )
      const server = await tf2QuickServer.waitForReady(game.gameServer.pendingTaskId, signal)
      game = await update(game.number, {
        $set: { gameServer: tf2QuickServer.toGameServer(server) },
      })
      logger.info({ serverId: game.gameServer!.id }, 'TF2 QuickServer ready')
    } else {
      await tf2QuickServer.waitForStv(game.gameServer.id)
    }
  }

  if (signal?.aborted) {
    throw new Error(`${signal.reason}`)
  }

  const password = generateGameserverPassword()

  return await withRcon(game, async ({ rcon }) => {
    let logSecret: string
    if (!game.gameServer!.logSecret) {
      logSecret = generate({
        length: 16,
        numbers: true,
        symbols: false,
        lowercase: false,
        uppercase: false,
      })
      await rcon.send(`sv_logsecret ${logSecret}`)
    } else {
      logSecret = game.gameServer!.logSecret
    }

    if (signal?.aborted) {
      throw new Error(`${signal.reason}`)
    }

    game = await update(
      { number: game.number, state: { $in: [GameState.created, GameState.configuring] } },
      {
        $set: {
          state: GameState.configuring,
          logSecret,
          password,
        },
        $unset: {
          connectString: 1,
          stvConnectString: 1,
        },
      },
    )

    for await (const line of compileConfig(game, password)) {
      logger.debug(line)
      const response = await rcon.send(line)
      if (line.startsWith('logaddress_add')) {
        await verifyLogTransmission({ rcon, logSecret, gameNumber: game.number, signal })
      }
      if (line.startsWith('changelevel')) {
        await delay(secondsToMilliseconds(10))
      }
      if (line.startsWith('tf_mm_match_begin')) {
        const acknowledged = response
          .split(/\r?\n/)
          .map(value => value.trim())
          .includes(`TFMM_MATCH_BEGIN_OK ${game.frontress!.externalMatchId}`)
        if (!acknowledged) throw errors.badGateway('game server is incompatible with Frontress')
      }
    }

    logger.info(game, `game ${game.number} configured`)

    const connectString = await makeConnectString({
      ...game.gameServer!,
      password,
    })
    logger.info(game, `connect string: ${connectString}`)

    const stvConnectString = await makeConnectString({
      address: game.gameServer!.stvAddress ?? game.gameServer!.address,
      port: game.gameServer!.stvPort ?? extractConVarValue(await rcon.send(`tv_port`)) ?? 27020,
      password: extractConVarValue(await rcon.send(`tv_password`)),
    })
    logger.info(game, `stv connect string: ${stvConnectString}`)

    if (signal?.aborted) {
      throw new Error(`${signal.reason}`)
    }

    game = await update(
      { number: game.number, state: GameState.configuring },
      {
        $set: {
          connectString,
          stvConnectString,
          state: GameState.launching,
        },
        $push: {
          events: {
            event: GameEventType.gameServerInitialized,
            at: new Date(),
          },
        },
      },
    )
    events.emit('game:gameServerInitialized', { game })

    return {
      connectString,
    }
  })
}

// keep in sync with GameServerCommandPreview in src/admin/games/views/html/game-server-command-preview.tsx
async function* compileConfig(game: GameModel, password: string): AsyncGenerator<RconCommand> {
  yield `logaddress_add ${environment.LOG_RELAY_ADDRESS}:${environment.LOG_RELAY_PORT}`
  yield 'kickall'

  if (game.kind === GameKind.frontress && game.frontress) {
    const spec = game.frontress
    yield `sv_password ${quote(password)}`
    yield `sv_tags ${quote(`tfmm:${spec.externalMatchId}`)}`
    yield `maxplayers ${spec.maxPlayers}`
    yield `tf_match_emulation ${spec.matchEmulation}`
    yield 'tf_match_emulation_restartmatch 0'
    yield 'tf_match_emulation_randommap 0'
    yield `tf_mm_trusted ${spec.matchEmulation === 0 ? 0 : 1}`
    if (spec.serverConfig) yield `exec ${spec.serverConfig}`

    const roster = game.slots
      .map(slot => `${slot.player}:${slot.team === Tf2Team.red ? 2 : 3}`)
      .join(',')
    yield `tf_mm_match_begin ${quote(spec.externalMatchId)} ${spec.matchGroup} ${quote(game.map)} ${quote(spec.serverConfig)} ${quote(password)} ${quote(roster)} ${spec.maxPlayers}`
    return
  }

  if (game.gameServer?.provider !== GameServerProvider.servemeTf) {
    // serveme.tf servers are already started with the proper map
    yield `changelevel ${game.map}`
  }

  const map = await collections.maps.findOne({ name: game.map })
  if (map?.execConfig) {
    yield `exec ${map.execConfig}`
  }

  const whitelistId = await configuration.get('games.whitelist_id')
  if (whitelistId !== null) {
    yield `tftrue_whitelist_id ${whitelistId}`
  }

  yield `sv_password ${password}`

  for (const slot of game.slots) {
    const player = await players.bySteamId(slot.player, ['name'])
    yield `sm_game_player_add ${slot.player} -name "${deburr(player.name)}" -team ${slot.team} -class ${slot.gameClass}`
  }

  yield 'sm_game_player_whitelist 1'
  yield `logstf_title ${environment.WEBSITE_NAME} #${game.number}`

  const logsTfUploadMethod = await configuration.get('games.logs_tf_upload_method')
  if (logsTfUploadMethod === LogsTfUploadMethod.gameserver) {
    yield `logstf_autoupload 2`
  } else {
    yield `logstf_autoupload 0`
  }

  const extraCommands = await configuration.get('games.execute_extra_commands')
  for (const command of extraCommands) {
    yield command as RconCommand
  }
}

function quote(value: string): string {
  return `"${value.replace(/[";\n]/g, '')}"`
}
