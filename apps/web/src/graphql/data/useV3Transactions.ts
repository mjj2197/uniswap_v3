import { useMemo } from 'react'
import { useTransactionsQuery } from '../thegraph/__generated__/types-and-hooks'
import { ApolloError } from '@apollo/client'

export enum TransSortMethod {
  PRICE = 'Price',
  VOLUME = 'Volume',
  PRICE_CHANGE = 'Price Change',
  TVL = 'TVL',
}

export type TableTransaction = {
  type: TransactionType
  hash: string
  timestamp: string
  sender: string
  token0: {
    address: string
    name: string
    symbol: string
    amount: number
  }
  token1: {
    address: string
    name: string
    symbol: string
    amount: number
  }
  amountUSD: number
}

export enum TransactionType {
  SWAP = 'Swap',
  MINT = 'Add',
  BURN = 'Remove',
}
export function useV3Transactions(filter: TransactionType[] = [TransactionType.SWAP, TransactionType.MINT, TransactionType.BURN]): {
  loading: boolean
  error: ApolloError | undefined
  data: TableTransaction[]
} {
  const { data, loading, error } = useTransactionsQuery()

  const unfilteredTransaction = data?.transactions.reduce((accum: TableTransaction[], t) => {
    const mintEntries = t.mints.map((m) => {
      return {
        type: TransactionType.MINT,
        hash: t.id,
        timestamp: t.timestamp,
        sender: m.origin,
        token0: {
          address: m.pool.token0.id,
          name: m.pool.token0.name,
          symbol: m.pool.token0.symbol,
          amount: m.amount0,
        },
        token1: {
          address: m.pool.token1.id,
          name: m.pool.token1.name,
          symbol: m.pool.token1.symbol,
          amount: m.amount1,
        },
        amountUSD: Number.parseFloat(m.amountUSD),
      }
    })
    const burnEntries = t.burns.map((m) => {
      return {
        type: TransactionType.BURN,
        hash: t.id,
        timestamp: t.timestamp,
        sender: m.origin,
        token0: {
          address: m.pool.token0.id,
          name: m.pool.token0.name,
          symbol: m.pool.token0.symbol,
          amount: m.amount0,
        },
        token1: {
          address: m.pool.token1.id,
          name: m.pool.token1.name,
          symbol: m.pool.token1.symbol,
          amount: m.amount1,
        },
        amountUSD: Number.parseFloat(m.amountUSD),
      }
    })

    const swapEntries = t.swaps.map((m) => {
      return {
        hash: t.id,
        type: TransactionType.SWAP,
        timestamp: t.timestamp,
        sender: m.origin,
        token0: {
          address: m.pool.token0.id,
          name: m.pool.token0.name,
          symbol: m.pool.token0.symbol,
          amount: m.amount0,
        },
        token1: {
          address: m.pool.token1.id,
          name: m.pool.token1.name,
          symbol: m.pool.token1.symbol,
          amount: m.amount1,
        },
        amountUSD: Number.parseFloat(m.amountUSD),
      }
    })
    // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
    return [...accum, ...mintEntries, ...burnEntries, ...swapEntries]
  }, [])

  const filteredTransactions = unfilteredTransaction?.filter((tx): tx is TableTransaction => tx.type && filter.includes(tx.type)) ?? []

  return useMemo(() => ({ data: filteredTransactions, loading, error }), [filteredTransactions, loading, error])
}
