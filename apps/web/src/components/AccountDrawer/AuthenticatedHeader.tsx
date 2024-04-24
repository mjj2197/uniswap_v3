import { t, Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceEventName, SharedEventName } from '@uniswap/analytics-events'
import { CurrencyAmount, Token } from '@jaguarswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, TraceEvent } from 'analytics'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column from 'components/Column'
import { ChainLogo, getDefaultBorderRadius } from 'components/Logo/ChainLogo'
import { CreditCardIcon } from 'components/Icons/CreditCard'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { ImagesIcon } from 'components/Icons/Images'
import { nativeOnChain } from 'constants/tokens'
import { Power } from 'components/Icons/Power'
import { Settings } from 'components/Icons/Settings'
import Row, { AutoRow } from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { getConnection } from 'connection'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import useENSName from 'hooks/useENSName'
import { useProfilePageState, useSellAsset, useWalletCollections } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from 'state/hooks'
import { setRecentConnectionDisconnected } from 'state/user/reducer'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { useUnitagByAddressWithoutFlag } from 'uniswap/src/features/unitags/hooksWithoutFlags'
import { isPathBlocked } from 'utils/blockedPaths'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { useCloseModal, useOpenModal, useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from '../../state/claim/hooks'
import { useCachedPortfolioBalancesQuery } from '../PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import { ActionTile } from './ActionTile'
import IconButton, { IconHoverText, IconWithConfirmTextButton } from './IconButton'
import MiniPortfolio from './MiniPortfolio'
import { useToggleAccountDrawer } from './MiniPortfolio/hooks'
import { portfolioFadeInAnimation } from './MiniPortfolio/PortfolioRow'
import { Status } from './Status'

import { useWalletBalance } from 'nft/hooks/useWalletBalance'

const AuthenticatedHeaderWrapper = styled.div`
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
`

const WalletButton = styled(ThemeButton)`
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 4px;
  color: white;
  border: none;
`

const UNIButton = styled(WalletButton)`
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 4px;
  color: white;
  border: none;
  background: linear-gradient(to right, #9139b0 0%, #4261d6 100%);
`

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  & > a,
  & > button {
    margin-right: 8px;
  }

  & > button:last-child {
    margin-right: 0px;
    ${IconHoverText}:last-child {
      left: 0px;
    }
  }
`

const HeaderWrapper = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const FadeInColumn = styled(Column)`
  ${portfolioFadeInAnimation}
`

const PortfolioDrawerContainer = styled(Column)`
  flex: 1;
`

export default function AuthenticatedHeader({ account, openSettings }: { account: string; openSettings: () => void }) {
  const { connector, chainId } = useWeb3React()
  const { balance: OKBBalance } = useWalletBalance()
  const { ENSName } = useENSName(account)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const closeModal = useCloseModal()
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)

  const nativeToken = nativeOnChain(chainId)
  // const shouldShowBuyFiatButton = !isPathBlocked('/buy')
  const { formatNumber, formatDelta } = useFormatter()

  // const shouldDisableNFTRoutes = useDisableNFTRoutes()

  // const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)

  // const isUnclaimed = useUserHasAvailableClaim(account)
  const connection = getConnection(connector)
  // const openClaimModal = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  const disconnect = useCallback(() => {
    connector.deactivate?.()
    connector.resetState()
    dispatch(setRecentConnectionDisconnected())
  }, [connector, dispatch])

  const toggleWalletDrawer = useToggleAccountDrawer()

  const navigateToProfile = useCallback(() => {
    toggleWalletDrawer()
    resetSellAssets()
    setSellPageState(ProfilePageStateType.VIEWING)
    clearCollectionFilters()
    navigate('/nfts/profile')
    closeModal()
  }, [clearCollectionFilters, closeModal, navigate, resetSellAssets, setSellPageState, toggleWalletDrawer])

  const openFiatOnrampModal = useOpenModal(ApplicationModal.FIAT_ONRAMP)
  const openFoRModalWithAnalytics = useCallback(() => {
    toggleWalletDrawer()
    sendAnalyticsEvent(InterfaceEventName.FIAT_ONRAMP_WIDGET_OPENED)
    openFiatOnrampModal()
  }, [openFiatOnrampModal, toggleWalletDrawer])

  const [shouldCheck, setShouldCheck] = useState(false)

  const { data: portfolioBalances } = useCachedPortfolioBalancesQuery({ account })
  const portfolio = portfolioBalances?.portfolios?.[0]
  const totalBalance = portfolio?.tokensTotalDenominatedValue?.value
  const absoluteChange = portfolio?.tokensTotalDenominatedValueChange?.absolute?.value
  const percentChange = portfolio?.tokensTotalDenominatedValueChange?.percentage?.value
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const { unitag } = useUnitagByAddressWithoutFlag(account, Boolean(account))

  return (
    <AuthenticatedHeaderWrapper>
      <HeaderWrapper>
        <Status account={account} ensUsername={ENSName} uniswapUsername={unitag?.username} connection={connection} />
        <IconContainer>
          <IconButton hideHorizontal={showDisconnectConfirm} data-testid="wallet-settings" onClick={openSettings} Icon={Settings} />
          <TraceEvent events={[BrowserEvent.onClick]} name={SharedEventName.ELEMENT_CLICKED} element={InterfaceElementName.DISCONNECT_WALLET_BUTTON}>
            <IconWithConfirmTextButton data-testid="wallet-disconnect" onConfirm={disconnect} onShowConfirm={setShowDisconnectConfirm} Icon={Power} text="Disconnect" dismissOnHoverOut />
          </TraceEvent>
        </IconContainer>
      </HeaderWrapper>
      <PortfolioDrawerContainer>
        {/* {OKBBalance !== undefined ? (
          <FadeInColumn gap="xs">
            <ThemedText.HeadlineLarge fontWeight={535} data-testid="portfolio-total-balance">
              <CurrencyLogo currency={nativeToken} style={{ marginRight: 8 }} size="50px" />
              {OKBBalance}
            </ThemedText.HeadlineLarge>
            <AutoRow marginBottom="20px">
              {absoluteChange !== 0 && percentChange && (
                <>
                  <DeltaArrow delta={absoluteChange} />
                  <ThemedText.BodySecondary>
                    {`${formatNumber({
                      input: Math.abs(absoluteChange as number),
                      type: NumberType.PortfolioBalance,
                    })} (${formatDelta(percentChange)})`}
                  </ThemedText.BodySecondary>
                </>
              )}
            </AutoRow>
          </FadeInColumn>
        ) : (
          <Column gap="xs">
            <LoadingBubble height="44px" width="170px" />
            <LoadingBubble height="16px" width="100px" margin="4px 0 20px 0" />
          </Column>
        )} */}
        <MiniPortfolio account={account} />
        {/* {isUnclaimed && (
          <UNIButton onClick={openClaimModal} size={ButtonSize.medium} emphasis={ButtonEmphasis.medium}>
            <Trans>Claim</Trans> {unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')} <Trans>reward</Trans>
          </UNIButton>
        )} */}
      </PortfolioDrawerContainer>
    </AuthenticatedHeaderWrapper>
  )
}
