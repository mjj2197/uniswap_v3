import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import { FilterHeaderRow, HeaderArrow, HeaderSortText, TimestampCell } from 'components/Table/styled'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { OrderDirection, Transaction_OrderBy, Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useMemo, useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'
import { useV3PoolTransactions } from 'graphql/data/pools/useV3PoolTransactions'
import { TableTransaction, V3PoolTransactionType } from 'graphql/data/useV3Transactions'
import { PoolToken } from 'graphql/data/pools/useV3Pools'

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral2};
  stroke: ${({ theme }) => theme.neutral2};
`

const TableWrapper = styled.div`
  min-height: 256px;
`

type PoolTxTableSortState = {
  sortBy: Transaction_OrderBy
  sortDirection: OrderDirection
}

enum PoolTransactionColumn {
  Timestamp,
  Type,
  MakerAddress,
  FiatValue,
  InputAmount,
  OutputAmount,
}

const PoolTransactionColumnWidth: { [key in PoolTransactionColumn]: number } = {
  [PoolTransactionColumn.Timestamp]: 120,
  [PoolTransactionColumn.Type]: 144,
  [PoolTransactionColumn.MakerAddress]: 100,
  [PoolTransactionColumn.FiatValue]: 125,
  [PoolTransactionColumn.InputAmount]: 125,
  [PoolTransactionColumn.OutputAmount]: 125,
}

function getTransactionMaker(type: V3PoolTransactionType, pool: TableTransaction): string | void {
  switch (type) {
    case V3PoolTransactionType.SELL:
    case V3PoolTransactionType.BUY:
      return pool.origin
    case V3PoolTransactionType.MINT:
    case V3PoolTransactionType.BURN:
      return pool.owner
    default:
      break
  }
}

export function PoolDetailsTransactionsTable({ poolAddress, token0, token1 }: { poolAddress: string; token0?: PoolToken; token1?: PoolToken }) {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const [filter, setFilters] = useState<V3PoolTransactionType[]>([V3PoolTransactionType.BUY, V3PoolTransactionType.SELL, V3PoolTransactionType.BURN, V3PoolTransactionType.MINT])

  const [sortState] = useState<PoolTxTableSortState>({
    sortBy: Transaction_OrderBy.Timestamp,
    sortDirection: OrderDirection.Desc,
  })
  const { data: transactions, loading, error } = useV3PoolTransactions(poolAddress, filter, token0)

  const showLoadingSkeleton = loading || !!error
  const anyError = Boolean(error);
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TableTransaction>()
    return [
      columnHelper.accessor((row) => row, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Timestamp]} justifyContent="flex-start">
            <Row gap="4px">
              {sortState.sortBy === Transaction_OrderBy.Timestamp && <HeaderArrow direction={OrderDirection.Desc} />}
              <HeaderSortText $active={sortState.sortBy === Transaction_OrderBy.Timestamp}>
                <Trans>Time</Trans>
              </HeaderSortText>
            </Row>
          </Cell>
        ),
        cell: (row) => (
          <Cell loading={showLoadingSkeleton} minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Timestamp]} justifyContent="flex-start">
            <TimestampCell timestamp={Number(row.getValue?.().timestamp)} link={getExplorerLink(chainId, row.getValue?.().hash, ExplorerDataType.TRANSACTION)} />
          </Cell>
        ),
      }),
      columnHelper.accessor(
        (row) => {
          let color, text
          if (row.type === V3PoolTransactionType.BUY || row.type === V3PoolTransactionType.SELL) {
            if (row.token0.address.toLowerCase() === token0?.address?.toLowerCase()) {
              color = 'success'
              text = (
                <span>
                  <Trans>Buy</Trans>&nbsp;{token0?.symbol}
                </span>
              )
            } else {
              color = 'critical'
              text = (
                <span>
                  <Trans>Sell</Trans>&nbsp;{token0?.symbol}
                </span>
              )
            }
          } else {
            color = row.type === V3PoolTransactionType.MINT ? 'success' : 'critical'
            text = row.type === V3PoolTransactionType.MINT ? <Trans>Add</Trans> : <Trans>Remove</Trans>
          }
          return <ThemedText.BodyPrimary color={color}>{text}</ThemedText.BodyPrimary>
        },
        {
          id: 'swap-type',
          header: () => (
            <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Type]} justifyContent="flex-start">
              <FilterHeaderRow modalOpen={filterModalIsOpen} onClick={() => toggleFilterModal()}>
                <Filter allFilters={Object.values(V3PoolTransactionType)} activeFilter={filter} setFilters={setFilters} isOpen={filterModalIsOpen} toggleFilterModal={toggleFilterModal} />
                <ThemedText.BodySecondary>
                  <Trans>Type</Trans>
                </ThemedText.BodySecondary>
              </FilterHeaderRow>
            </Cell>
          ),
          cell: (PoolTransactionTableType) => (
            <Cell loading={showLoadingSkeleton} minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Type]} justifyContent="flex-start">
              {PoolTransactionTableType.getValue?.()}
            </Cell>
          ),
        }
      ),
      columnHelper.accessor((row) => row.amountUSD, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.FiatValue]} justifyContent="flex-end" grow>
            <ThemedText.BodySecondary>
              <Trans>{activeLocalCurrency}</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell loading={showLoadingSkeleton} minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.FiatValue]} justifyContent="flex-end" grow>
            <ThemedText.BodyPrimary>{formatFiatPrice({ price: fiat.getValue?.() })}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor(
        (row) => {
          return row.token0.address.toLowerCase() === token0?.address?.toLowerCase() ? row.token0.amount : row.token1.amount
        },
        {
          id: 'input-amount',
          header: () => (
            <Cell loading={showLoadingSkeleton} minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.InputAmount]} justifyContent="flex-end" grow>
              <ThemedText.BodySecondary>{token0?.symbol}</ThemedText.BodySecondary>
            </Cell>
          ),
          cell: (inputTokenAmount) => (
            <Cell loading={showLoadingSkeleton} minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.InputAmount]} justifyContent="flex-end" grow>
              <ThemedText.BodyPrimary>{formatNumber({ input: Math.abs(Number.parseFloat(inputTokenAmount.getValue?.() ?? 0)), type: NumberType.TokenTx })}</ThemedText.BodyPrimary>
            </Cell>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => {
          return row.token0.address.toLowerCase() === token0?.address?.toLowerCase() ? row.token1.amount : row.token0.amount
        },
        {
          id: 'output-amount',
          header: () => (
            <Cell loading={showLoadingSkeleton} minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.OutputAmount]} justifyContent="flex-end" grow>
              <ThemedText.BodySecondary>{token1?.symbol}</ThemedText.BodySecondary>
            </Cell>
          ),
          cell: (outputTokenAmount) => (
            <Cell loading={showLoadingSkeleton} minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.OutputAmount]} justifyContent="flex-end" grow>
              <ThemedText.BodyPrimary>{formatNumber({ input: Math.abs(Number.parseFloat(outputTokenAmount.getValue?.() ?? 0)), type: NumberType.TokenTx })}</ThemedText.BodyPrimary>
            </Cell>
          ),
        }
      ),
      columnHelper.accessor((row) => getTransactionMaker(row.type as V3PoolTransactionType, row), {
        id: 'maker-address',
        header: () => (
          <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.MakerAddress]} justifyContent="flex-end" grow>
            <ThemedText.BodySecondary>
              <Trans>Wallet</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell loading={showLoadingSkeleton} minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.MakerAddress]} justifyContent="flex-end" grow>
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.() ?? "", ExplorerDataType.ADDRESS)}>
              <ThemedText.BodyPrimary>{shortenAddress(makerAddress.getValue?.() ?? "", 0)}</ThemedText.BodyPrimary>
            </StyledExternalLink>
          </Cell>
        ),
      }),
    ]
  }, [activeLocalCurrency, chainId, filter, filterModalIsOpen, formatFiatPrice, formatNumber, showLoadingSkeleton, sortState.sortBy, token0?.address, token0?.symbol, token1?.symbol])

  return (
    <TableWrapper data-testid="pool-details-transactions-table">
      <Table columns={columns} data={transactions} loading={loading} error={error} maxHeight={600} />
    </TableWrapper>
  )
}
