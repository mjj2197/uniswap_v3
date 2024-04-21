import { useMemo } from 'react'
import { useTokenPoolsQuery, useTokenTransactionsQuery } from '../thegraph/__generated__/types-and-hooks'
import { ApolloError } from '@apollo/client'
import { TableTransaction } from '../data/useV3Transactions'
import { PoolFields, PoolTableSortState, TablePool, sortPools } from './pools/useV3Pools'

export enum TokenTransactionType {
  SELL = 'Sell',
  BUY = 'Buy',
}
export function useV3TokenPools(
  address: string,
  sortState: PoolTableSortState
): {
  loading: boolean
  error: boolean
  data: TablePool[]
} {
  const { data: pools, error, loading } = useTokenPoolsQuery({ variables: { address } })

  const unsortedPools =
    [...(pools?.asToken0 ?? []), ...(pools?.asToken1 ?? [])].map((pool) => {
      return {
        hash: pool.id,
        token0: {
          address: pool.token0.id,
          name: pool.token0.name,
          symbol: pool.token0.symbol,
        },
        token1: {
          address: pool.token1.id,
          name: pool.token1.name,
          symbol: pool.token1.symbol,
        },
        txCount: Number.parseInt(pool.txCount),
        tvl: Number.parseInt(pool.totalValueLockedUSD),
        tvlUSD: pool.totalValueLockedUSD,
        tvlUSDChange: 0,
        volume24h: 0,
        volumeChange: 0,
        volumeWeek: 0,
        feeTier: pool.feeTier,
      } as TablePool
    }) ?? []

  const unfilteredPools = sortPools(unsortedPools, sortState)

  // const filteredPools = useFilteredPools(unfilteredPools).slice(0, 100)
  return { data: unfilteredPools, loading, error: Boolean(error) }
}
