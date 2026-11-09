import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'contador-tokens',
  component: 'AbovePrompt',
  surface: 'desktop',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 10 },
  },
} as const

const MEASURE = {
  context: { tokens: 45_200, window: 200_000, percent: 23 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 92.4 },
    { kind: 'seven_day', percentUsed: 40 },
  ],
  changed: ['context', 'rateLimits'],
} as const

async function measured($: any, on: any, input: unknown = MEASURE) {
  on('session.measure', (_: unknown, e: { changed: unknown }) => ({ changed: e.changed }))
  await $.session.measure(input)

  return $.ui.mount(BAND)
}

test('mostra Tokens e o grupo Limites, com o que resta em cada bateria', async ($, on) => {
  const ui = await measured($, on)

  const texts = await ui.findAll({ type: 'Text' })
  expect(texts.map((text: { text: string }) => text.text)).toEqual(['Tokens', 'Limites:', '5h', '7d'])

  const svgs = await ui.findAll({ type: 'Svg' })
  expect(svgs.map((svg: { props: { alt: string } }) => svg.props.alt)).toEqual([
    'Tokens: 77% restante',
    '5h: 8% restante',
    '7d: 60% restante',
  ])
  expect(svgs[0].props.source).toContain('>77</text>')
  await ui.unmount()
})

test('o cache não aparece mais', async ($, on) => {
  const ui = await measured($, on)

  expect(await ui.find({ type: 'Text', text: /Cache/ })).toBeUndefined()
  await ui.unmount()
})

test('a bateria fica vermelha quando resta pouco', async ($, on) => {
  const ui = await measured($, on)
  const [tokens, fiveHour] = await ui.findAll({ type: 'Svg' })

  expect(tokens.props.source).not.toContain('#ff453a')
  expect(fiveHour.props.source).toContain('#ff453a')
  await ui.unmount()
})

test('sem limites (chave de API) o grupo Limites some', async ($, on) => {
  const ui = await measured($, on, { ...MEASURE, rateLimits: [] })

  expect(await ui.find({ type: 'Text', text: /Limites/ })).toBeUndefined()
  expect((await ui.findAll({ type: 'Svg' })).length).toBe(1)
  await ui.unmount()
})

test('o início da sessão preenche a faixa', async ($, on) => {
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 200_000 }, rateLimits: [] },
  }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount(BAND)

  expect((await ui.find({ type: 'Svg' }))?.props.alt).toBe('Tokens: 100% restante')
  await ui.unmount()
})

test('sem medição a faixa fica para o app', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  const ui = await $.ui.mount(BAND)

  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
})
