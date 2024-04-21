import { ApolloError } from '@apollo/client'
import { ChainId, Token } from '@jaguarswap/sdk-core'
import { PoolTableColumns, PoolsTable, sortAscendingAtom, sortMethodAtom } from 'components/Pools/PoolTable/PoolTable'
import { OrderDirection } from 'graphql/data/util'
import { useAtomValue, useResetAtom } from 'jotai/utils'
import { useEffect, useMemo } from 'react'
import { useV3TokenPools } from 'graphql/data/useV3TokenPools'

const HIDDEN_COLUMNS = [ PoolTableColumns.Volume24h, PoolTableColumns.VolumeChange, PoolTableColumns.VolumeWeek]

export function TokenDetailsPoolsTable({ chainId, referenceToken }: { chainId: ChainId; referenceToken: Token }) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
  const sortState = useMemo(() => ({ sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc }), [sortAscending, sortMethod])
  const { data: pools, loading, error } = useV3TokenPools(referenceToken.address.toLowerCase(), sortState)
  const combinedError = error
    ? new ApolloError({
        errorMessage: `Could not retrieve V3 Pools for token ${referenceToken.address} on chain: ${chainId}`,
      })
    : undefined

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  return (
    <div data-testid={`tdp-pools-table-${referenceToken.address.toLowerCase()}`}>
      <PoolsTable pools={pools} loading={loading} error={combinedError} chainId={chainId} maxHeight={600} hiddenColumns={HIDDEN_COLUMNS} loadMore={loading} />
    </div>
  )
}
