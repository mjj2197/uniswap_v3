import { ApolloError } from '@apollo/client'
import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { ChainId, Token } from '@jaguarswap/sdk-core'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import { FilterHeaderRow, HeaderArrow, HeaderSortText, StyledExternalLink, TimestampCell, TokenLinkCell } from 'components/Table/styled'
import { unwrapToken } from 'graphql/data/util'
import { OrderDirection, Swap_OrderBy } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useMemo, useReducer, useState } from 'react'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { Token as GQLToken } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'
import { TableTransaction } from '../../../../graphql/data/useV3Transactions'
import { useV3TokenTransactions, TokenTransactionType } from '../../../../graphql/data/useV3TokenTransactions'

const StyledSwapAmount = styled(ThemedText.BodyPrimary)`
  display: inline-block;
  ${EllipsisStyle}
  max-width: 75px;
`

const TableWrapper = styled.div`
  min-height: 158px;
`
interface SwapTransaction {
  hash: string
  timestamp: number
  input: SwapLeg
  output: SwapLeg
  usdValue: number
  makerAddress: string
}

interface SwapLeg {
  address?: string
  symbol?: string
  amount: number
  token: GQLToken
}

type TokenTxTableSortState = {
  sortBy: Swap_OrderBy
  sortDirection: OrderDirection
}

export function TransactionsTable({ chainId, referenceToken }: { chainId: ChainId; referenceToken: Token }) {
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const [filter, setFilters] = useState<TokenTransactionType[]>([TokenTransactionType.BUY, TokenTransactionType.SELL])

  const { data: transactions, loading, error } = useV3TokenTransactions(referenceToken.address.toLowerCase(), filter)

  const combinedError = error
    ? new ApolloError({
        errorMessage: `Could not retrieve V3 Transactions for token: ${referenceToken.address} on chain: ${chainId}`,
      })
    : undefined
  const allDataStillLoading = loading && !transactions.length
  const unwrappedReferenceToken = unwrapToken(chainId, referenceToken)

  const showLoadingSkeleton = allDataStillLoading || !!combinedError

  // TODO(WEB-3236): once GQL BE Transaction query is supported add usd, token0 amount, and token1 amount sort support
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
        id: 'type',
        header: () => (
          <Cell justifyContent="flex-start" grow>
            <FilterHeaderRow modalOpen={filterModalIsOpen} onClick={() => toggleFilterModal()}>
              <Filter allFilters={Object.values(TokenTransactionType)} activeFilter={filter} setFilters={setFilters} isOpen={filterModalIsOpen} toggleFilterModal={toggleFilterModal} isSticky={true} />
              <ThemedText.BodySecondary>
                <Trans>Type</Trans>
              </ThemedText.BodySecondary>
            </FilterHeaderRow>
          </Cell>
        ),
        cell: (transaction) => {
          const isBuy = transaction.getValue?.().type === TokenTransactionType.BUY
          return (
            <Cell loading={showLoadingSkeleton} minWidth={75} justifyContent="flex-start" grow>
              <ThemedText.BodyPrimary color={isBuy ? 'success' : 'critical'}>{isBuy ? <Trans>Buy</Trans> : <Trans>Sell</Trans>}</ThemedText.BodyPrimary>
            </Cell>
          )
        },
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
                  input: Math.abs(Number.parseFloat(transaction.getValue?.().token0.amount ?? 0)) || 0,
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
                  input: Math.abs(Number.parseFloat(transaction.getValue?.().token1.amount)) || 0,
                })}
              </ThemedText.BodyPrimary>
              <TokenLinkCell token={transaction.getValue?.().token1} />
            </Row>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction.sender, {
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
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.() ?? '', ExplorerDataType.ADDRESS)}>{shortenAddress(makerAddress.getValue?.())}</StyledExternalLink>
          </Cell>
        ),
      }),
    ]
  }, [activeLocalCurrency, chainId, filter, filterModalIsOpen, formatFiatPrice, formatNumber, showLoadingSkeleton])

  return (
    <TableWrapper>
      <Table columns={columns} data={transactions} loading={allDataStillLoading} error={combinedError} maxHeight={600} />
    </TableWrapper>
  )
}
