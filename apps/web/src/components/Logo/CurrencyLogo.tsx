import { Currency } from '@jaguarswap/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'

import AssetLogo, { AssetLogoBaseProps } from './AssetLogo'

export default function CurrencyLogo(
  props: AssetLogoBaseProps & {
    currency?: Currency | null
  }
) {
  return (
    <AssetLogo
      currency={props.currency}
      isNative={props.currency?.isNative}
      chainId={props.currency?.chainId}
      address={props.currency?.wrapped.address}
      symbol={props.symbol ?? props.currency?.symbol}
      // FIXME: 先删除掉，看有什么影响
      // primaryImg={(props.currency?.tokenInfo ? props.currency?.tokenInfo : props.currency as TokenInfo)?.logoURI}
      {...props}
    />
  )
}
