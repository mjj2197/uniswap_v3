import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import { useWeb3React } from '@web3-react/core'
import { useTokenBalancesWithLoadingIndicator, useNativeCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import { nativeOnChain } from 'constants/tokens'
import { getInitialUrl } from 'hooks/useAssetLogoSource'
import { PortfolioToken } from 'graphql/data/portfolios'
import { getTokenDetailsURL, CHAIN_ID_TO_BACKEND_NAME, logSentryErrorForUnsupportedChain } from 'graphql/data/util'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { PortfolioTokenBalancePartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import { useToggleAccountDrawer } from '../hooks'

import { STABLECOINS } from 'constants/tokens'
import { Token } from '@jaguarswap/sdk-core'

export default function Tokens({ account }: { account: string }) {
  const { chainId } = useWeb3React() // we cannot fetch balances cross-chain
  const toggleWalletDrawer = useToggleAccountDrawer()

  const stableCoins = STABLECOINS[chainId]
  const nativeToken = nativeOnChain(chainId)

  const nativeBalance = useNativeCurrencyBalances([account])
  const [data, loading] = useTokenBalancesWithLoadingIndicator(account, stableCoins)

  if (loading) {
    return <PortfolioSkeleton />
  }

  if (Object.keys(data)?.length === 0) {
    // TODO: consider launching moonpay here instead of just closing the drawer
    return <EmptyWalletModule type="token" onNavigateClick={toggleWalletDrawer} />
  }

  const nativeAmount = nativeBalance[account]
  return (
    <PortfolioTabWrapper>
      {nativeAmount && <TokenRow key={nativeAmount.address} token={nativeAmount} isNative />}
      {(stableCoins as Token[]).map((token) => {
        if (data[token.address]) {
          return <TokenRow key={token.address} token={data[token.address]} />
        }
        return null
      })}
    </PortfolioTabWrapper>
  )
}

const TokenBalanceText = styled(ThemedText.BodySecondary)`
  ${EllipsisStyle}
`
const TokenNameText = styled(ThemedText.SubHeader)`
  ${EllipsisStyle}
`

function TokenRow({ token, isNative }: { token: PortfolioToken, isNative?: boolean }) {
  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleAccountDrawer()

  const currency = token.currency
  if (!currency) {
    logSentryErrorForUnsupportedChain({
      extras: { token },
      errorMessage: 'Token from unsupported chain received from Mini Portfolio Token Balance Query',
    })
    return null
  }
  const navigateToTokenDetails = useCallback(async () => {
    navigate(
      getTokenDetailsURL({
        address: currency.address,
        chain: CHAIN_ID_TO_BACKEND_NAME[currency.chainId],
      })
    )
    toggleWalletDrawer()
  }, [navigate, currency, toggleWalletDrawer])

  const logoImage = getInitialUrl(currency.address, currency.chainId, currency.isNative)
  const { formatNumber } = useFormatter()

  return (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={SharedEventName.ELEMENT_CLICKED}
      element={InterfaceElementName.MINI_PORTFOLIO_TOKEN_ROW}
      properties={{ chain_id: currency.chainId, token_name: currency?.name, address: currency?.address }}
    >
      <PortfolioRow
        left={<PortfolioLogo chainId={currency.chainId} currencies={[currency]} images={[logoImage]} size="40px" />}
        title={<TokenNameText>{currency?.name}</TokenNameText>}
        descriptor={<TokenBalanceText>{currency?.symbol}</TokenBalanceText>}
        onClick={navigateToTokenDetails}
        right={
          <>
            <ThemedText.SubHeader>
              {formatNumber({
                input: token.toFixed(2),
                type: isNative ? NumberType.TokenNonTx : NumberType.PortfolioBalance,
              })}
            </ThemedText.SubHeader>
          </>
        }
      />
    </TraceEvent>
  )
}
