import { ChainId, Token } from '@jaguarswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenQueryData } from 'graphql/data/Token'
import { TableToken } from 'graphql/data/useV3Tokens'
import { gqlToCurrency } from 'graphql/data/util'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { AppState } from 'state/reducer'
import { getInitialUrl } from 'hooks/useAssetLogoSource'

import { AssetLogoBaseProps } from './AssetLogo'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TableToken | TokenQueryData | SearchToken
  }
) {
  const chainId = useAppSelector((state: AppState) => state.application.chainId)

  const currency = props.token ? gqlToCurrency(props.token, chainId as ChainId) : undefined

  const logoUrl = getInitialUrl((currency as Token)?.address, currency?.chainId, currency?.isNative)

  return <PortfolioLogo currencies={useMemo(() => [currency], [currency])} chainId={chainId as ChainId} images={[logoUrl]} {...props} />
}
