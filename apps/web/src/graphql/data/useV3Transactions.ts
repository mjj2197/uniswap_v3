import { useMemo } from 'react'
import { useTransactionsQuery } from '../thegraph/__generated__/types-and-hooks'
import { ApolloError } from '@apollo/client'
import { TokenTransactionType } from './useV3TokenTransactions'

export enum TransSortMethod {
  PRICE = 'Price',
  VOLUME = 'Volume',
  PRICE_CHANGE = 'Price Change',
  TVL = 'TVL',
}

export type TableTransaction = {
  type: TransactionType | TokenTransactionType | V3PoolTransactionType | V3PoolTransactionType
  hash: string
  timestamp: string
  sender?: string
  owner?: string
  origin?: string
  token0: {
    address: string
    name: string
    symbol: string
    amount: string
  }
  token1: {
    address: string
    name: string
    symbol: string
    amount: string
  }
  amountUSD: number
}
export enum V3PoolTransactionType {
  BUY = 'Buy',
  SELL = 'Sell',
  BURN = 'Burn',
  MINT = 'Mint',
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
        owner: m.owner,
        origin: m.origin,
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
        owner: m.owner,
        origin: m.origin,
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
        origin: m.origin,
        sender: m.sender,
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

  // @ts-ignore
  const filteredTransactions = unfilteredTransaction?.filter((tx): tx is TableTransaction => tx.type && filter.includes(tx.type)) ?? []

  return useMemo(() => ({ data: filteredTransactions, loading, error }), [filteredTransactions, loading, error])
}
