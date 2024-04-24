import { t } from '@lingui/macro'
import { TablePool } from 'graphql/data/pools/useV3Pools'

export const getPoolDetailPageTitle = (poolData?: TablePool) => {
  const token0Symbol = poolData?.token0.symbol
  const token1Symbol = poolData?.token1.symbol

  const baseTitle = t`Buy, sell, and trade on Uniswap`
  if (!token0Symbol || !token1Symbol) {
    return baseTitle
  }

  return `${token0Symbol}/${token1Symbol}: ${baseTitle}`
}
