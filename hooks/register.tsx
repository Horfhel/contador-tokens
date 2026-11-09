import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Snapshot } from '../types'

const snapshot = atom({ plugin: 'contador-tokens', key: 'snapshot' } as const, null)

const LOW_AT = 20
const TEXT_BAR_CELLS = 10

// Escala de espaçamento, em células: cada nível é o dobro do anterior.
const GAP_LABEL = 1
const GAP_ITEM = 2
const GAP_GROUP = 4

const BATTERY_WIDTH = 36
const BATTERY_HEIGHT = 18
const BATTERY_INNER_X = 1.5
const BATTERY_INNER_Y = 1.5
const BATTERY_INNER_WIDTH = 29
const BATTERY_INNER_HEIGHT = 15
const BATTERY_MIN_FILL = 2
const BATTERY_NUMBER_CENTER = 16
// Corpo sólido em vez de contorno: o app não informa o tema ao mod, e assim o
// número fica legível no modo claro e no escuro.
const BATTERY_TRACK = '#48484a'
const BATTERY_FILL = '#aeaeb2'
const BATTERY_LOW_FILL = '#ff453a'
const BATTERY_CAP = '#8e8e93'
const NUMBER_ON_TRACK = '#ffffff'
const NUMBER_ON_FILL = '#1c1c1e'

type Battery = { label: string; level: number }

const LIMIT_LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  spend_limit: 'Gasto',
}

function toSnapshot(context: SessionContextUsage, limits: SessionRateLimit[]): Snapshot {
  return {
    percent: context.percent,
    limits: limits.map(({ kind, percentUsed }) => ({ kind, percentUsed })),
  }
}

function remaining(percentUsed: number): number {
  return Math.max(0, Math.min(100, 100 - percentUsed))
}

function tenths(value: number): number {
  return Math.round(value * 10) / 10
}

function batterySvg(level: number): string {
  const fill = level <= LOW_AT ? BATTERY_LOW_FILL : BATTERY_FILL
  const width = level > 0 ? Math.max(BATTERY_MIN_FILL, tenths((level / 100) * BATTERY_INNER_WIDTH)) : 0
  const split = tenths(BATTERY_INNER_X + width)

  // O número é desenhado duas vezes, cada metade na cor que contrasta com o
  // que está atrás dela. Cada <svg> interno recorta o que passa da sua largura.
  const number = (x: number, panelWidth: number, color: string) =>
    `<svg x="${x}" y="0" width="${panelWidth}" height="${BATTERY_HEIGHT}">` +
    `<text x="${tenths(BATTERY_NUMBER_CENTER - x)}" y="13.2" text-anchor="middle" ` +
    `font-family="-apple-system,'SF Pro Text',system-ui,sans-serif" font-size="11.5" font-weight="700" ` +
    `fill="${color}">${Math.round(level)}</text></svg>`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BATTERY_WIDTH}" height="${BATTERY_HEIGHT}" viewBox="0 0 ${BATTERY_WIDTH} ${BATTERY_HEIGHT}">` +
    `<rect x="0" y="0" width="32" height="${BATTERY_HEIGHT}" rx="5" fill="${BATTERY_TRACK}"/>` +
    `<rect x="${BATTERY_INNER_X}" y="${BATTERY_INNER_Y}" width="${width}" height="${BATTERY_INNER_HEIGHT}" rx="3.5" fill="${fill}"/>` +
    number(0, split, NUMBER_ON_FILL) +
    number(split, tenths(BATTERY_WIDTH - split), NUMBER_ON_TRACK) +
    `<path d="M33 6v6c1.3-.4 2.2-1.6 2.2-3S34.3 6.4 33 6z" fill="${BATTERY_CAP}"/>` +
    '</svg>'
  )
}

function textBar(level: number): string {
  const filled = Math.round((level / 100) * TEXT_BAR_CELLS)

  return '█'.repeat(filled) + '░'.repeat(TEXT_BAR_CELLS - filled)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const usage = await $.session.usage()
    await update($, snapshot, () => toSnapshot(usage.context, usage.rateLimits))

    return result
  })

  on('session.measure', async ($, e, next) => {
    await update($, snapshot, () => toSnapshot(e.context, e.rateLimits))

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const data = await read($, snapshot)

    if (e.props.hasSurvey || data === null) {
      return next(e)
    }

    const tokens: Battery = { label: 'Tokens', level: remaining(data.percent ?? 0) }
    const limits: Battery[] = data.limits.map(limit => ({
      label: LIMIT_LABELS[limit.kind] ?? limit.kind,
      level: remaining(limit.percentUsed),
    }))

    if (e.surface === 'desktop') {
      const { Box, Svg, Text } = $.ui.resolve(e)
      const drawBattery = ({ label, level }: Battery) => (
        <Box key={label} flexDirection="row" alignItems="center" columnGap={GAP_LABEL}>
          <Text size="footnote" weight="medium" dimColor>
            {label}
          </Text>
          <Svg
            source={batterySvg(level)}
            alt={`${label}: ${Math.round(level)}% restante`}
            width={BATTERY_WIDTH}
            height={BATTERY_HEIGHT}
          />
        </Box>
      )

      return (
        <Box flexDirection="row" alignItems="center" columnGap={GAP_GROUP}>
          {drawBattery(tokens)}
          {limits.length > 0 ? (
            <Box key="limites" flexDirection="row" alignItems="center" columnGap={GAP_ITEM}>
              <Text size="footnote" weight="semibold">
                Limites:
              </Text>
              {limits.map(drawBattery)}
            </Box>
          ) : null}
        </Box>
      )
    }

    const { Box, Text } = $.ui.resolve(e)
    const drawBar = ({ label, level }: Battery) => (
      <Text key={label} dimColor>
        {label} {textBar(level)} {Math.round(level)}
      </Text>
    )

    return (
      <Box flexDirection="row" columnGap={GAP_GROUP}>
        {drawBar(tokens)}
        {limits.length > 0 ? (
          <Box key="limites" flexDirection="row" columnGap={GAP_ITEM}>
            <Text bold>Limites:</Text>
            {limits.map(drawBar)}
          </Box>
        ) : null}
      </Box>
    )
  })
}
