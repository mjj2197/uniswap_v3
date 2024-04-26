import { useMemo } from 'react'
import { useTokenTransactionsQuery } from '../thegraph/__generated__/types-and-hooks'
import { ApolloError } from '@apollo/client'
import { TableTransaction } from '../data/useV3Transactions'

export enum TokenTransactionType {
  SELL = 'Sell',
  BUY = 'Buy',
}
export function useV3TokenTransactions(
  address: string,
  filter: TokenTransactionType[] = [TokenTransactionType.SELL, TokenTransactionType.BUY]
): {
  loading: boolean
  error: ApolloError | undefined
  data: TableTransaction[]
} {
  const { data, loading, error } = useTokenTransactionsQuery({
    variables: {
      address: address,
    },
  })

  const unfilteredTransaction: TableTransaction[] = []

  for (const t of data?.swapsAs0 ?? []) {
    unfilteredTransaction.push({
      type: t.amount0 > 0 ? TokenTransactionType.SELL : TokenTransactionType.BUY,
      hash: t.transaction.id,
      timestamp: t.timestamp,
      sender: t.origin,
      token0: {
        address: t.pool.token0.id,
        name: t.pool.token0.name,
        symbol: t.pool.token0.symbol,
        amount: t.amount0,
      },
      token1: {
        address: t.pool.token1.id,
        name: t.pool.token1.name,
        symbol: t.pool.token1.symbol,
        amount: t.amount1,
      },
      amountUSD: Number.parseFloat(t.amountUSD),
    })
  }
  for (const t of data?.swapsAs1 ?? []) {
    unfilteredTransaction.push({
      type: t.amount1 > 0 ? TokenTransactionType.SELL : TokenTransactionType.BUY,
      hash: t.transaction.id,
      timestamp: t.timestamp,
      sender: t.origin,
      token0: {
        address: t.pool.token0.id,
        name: t.pool.token0.name,
        symbol: t.pool.token0.symbol,
        amount: t.amount0,
      },
      token1: {
        address: t.pool.token1.id,
        name: t.pool.token1.name,
        symbol: t.pool.token1.symbol,
        amount: t.amount1,
      },
      amountUSD: Number.parseFloat(t.amountUSD),
    })
  }

  // @ts-ignore
  const filteredTransactions = unfilteredTransaction?.filter((tx): tx is TableTransaction => tx.type && filter.includes(tx.type)) ?? []

  return useMemo(() => ({ data: filteredTransactions, loading, error }), [filteredTransactions, loading, error])
}
