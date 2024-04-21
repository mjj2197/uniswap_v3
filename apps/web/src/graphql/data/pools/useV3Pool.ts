import { useMemo } from 'react'
import { usePoolByIdQuery } from '../../thegraph/__generated__/types-and-hooks'
import type { TablePool } from './useV3Pools'

export function useV3Pool(address: string): {
  loading: boolean
  error: boolean
  data: TablePool | undefined
} {
  const { data, error, loading } = usePoolByIdQuery({ variables: { address } })

  const pool = data?.pool ?? undefined

  return useMemo(
    () => ({
      data: pool
        ? {
            hash: pool.id || '',
            token0: {
              address: pool.token0.id,
              symbol: pool.token0.symbol,
              name: pool.token0.name,
            },
            token1: {
              address: pool.token1.id,
              symbol: pool.token1.symbol,
              name: pool.token1.name,
            },
            txCount: pool.txCount,
            tvl: pool.totalValueLockedUSD,
            tvlUSD: pool.totalValueLockedUSD,

            volumeChange: 0,
            volume24h: 0,
            volumeWeek: 0,

            // biome-ignore lint/suspicious/noExplicitAny: <explanation>,
            feeTier: pool.feeTier,

            token0Price: pool.token0Price,
            token1Price: pool.token1Price,
            totalValueLockedToken0: pool.totalValueLockedToken0,
            totalValueLockedToken1: pool.totalValueLockedToken1,
            totalValueLockedUSD: pool.totalValueLockedUSD,
          }
        : undefined,
      loading,
      error: Boolean(error),
    }),
    [pool, loading, error]
  )
}
