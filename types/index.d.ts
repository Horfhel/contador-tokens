export type Limit = { kind: string; percentUsed: number }

export type Snapshot = {
  percent?: number
  limits: Limit[]
}

declare module 'claude-code' {
  interface PluginState {
    'contador-tokens': {
      snapshot: Snapshot | null
    }
  }
}
