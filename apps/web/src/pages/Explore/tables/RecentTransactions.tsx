import React from 'react'
import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import { FilterHeaderRow, StyledExternalLink, TimestampCell, TokenLinkCell } from 'components/Table/styled'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useMemo, useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { shortenAddress } from 'utilities/src/addresses'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'
import { useV3Transactions, TransactionType, TableTransaction } from '../../../graphql/data/useV3Transactions'

export default function RecentTransactions() {
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const [filter, setFilters] = useState<TransactionType[]>([TransactionType.SWAP, TransactionType.BURN, TransactionType.MINT])
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)

  const { data: transactions, loading, error } = useV3Transactions(filter)

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TableTransaction>()
    return [
      columnHelper.accessor((transaction) => transaction, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={120} justifyContent="flex-start" grow>
            <Row gap="4px">
              <Trans>Time</Trans>
            </Row>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton} minWidth={120} justifyContent="flex-start" grow>
            <TimestampCell timestamp={Number(transaction.getValue?.().timestamp)} link={getExplorerLink(chainId, transaction.getValue?.().hash, ExplorerDataType.TRANSACTION)} />
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'swap-type',
        header: () => (
          <Cell minWidth={276} justifyContent="flex-start" grow>
            <FilterHeaderRow modalOpen={filterModalIsOpen} onClick={() => toggleFilterModal()}>
              <Filter allFilters={Object.values(TransactionType)} activeFilter={filter} setFilters={setFilters} isOpen={filterModalIsOpen} toggleFilterModal={toggleFilterModal} isSticky={true} />
              <ThemedText.BodySecondary>
                <Trans>Type</Trans>
              </ThemedText.BodySecondary>
            </FilterHeaderRow>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton} minWidth={276} justifyContent="flex-start" grow>
            <Row gap="8px">
              <ThemedText.BodySecondary>
                <Trans>{transaction.getValue?.().type}</Trans>
              </ThemedText.BodySecondary>
              <TokenLinkCell token={transaction.getValue?.().token0} />
              <ThemedText.BodySecondary>{transaction.getValue?.().type === TransactionType.SWAP ? <Trans>for</Trans> : <Trans>and</Trans>}</ThemedText.BodySecondary>
              <TokenLinkCell token={transaction.getValue?.().token1} />
            </Row>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction.amountUSD, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={125}>
            <ThemedText.BodySecondary>{activeLocalCurrency}</ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell loading={showLoadingSkeleton} minWidth={125}>
            <ThemedText.BodyPrimary>{formatFiatPrice({ price: fiat.getValue?.() })}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'token-amount-0',
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans>Token amount</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <Row gap="8px" justify="flex-end">
              <ThemedText.BodyPrimary>
                {formatNumber({
                  input: Math.abs(transaction.getValue?.().token0.amount) || 0,
                })}
              </ThemedText.BodyPrimary>
              <TokenLinkCell token={transaction.getValue?.().token0} />
            </Row>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'token-amount-1',
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans>Token amount</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <Row gap="8px" justify="flex-end">
              <ThemedText.BodyPrimary>
                {formatNumber({
                  input: Math.abs(transaction.getValue?.().token1.amount) || 0,
                })}
              </ThemedText.BodyPrimary>
              <TokenLinkCell token={transaction.getValue?.().token1} />
            </Row>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction.origin || transaction.sender, {
        id: 'maker-address',
        header: () => (
          <Cell minWidth={150}>
            <ThemedText.BodySecondary>
              <Trans>Wallet</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell loading={showLoadingSkeleton} minWidth={150}>
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}>{shortenAddress(makerAddress.getValue?.())}</StyledExternalLink>
          </Cell>
        ),
      }),
    ]
  }, [activeLocalCurrency, chainId, filter, filterModalIsOpen, formatFiatPrice, formatNumber, showLoadingSkeleton])

  return <Table columns={columns} data={transactions} loading={loading} error={error} loadMore={loading} maxWidth={1200} />
}
