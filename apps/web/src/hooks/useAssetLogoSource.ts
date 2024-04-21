import tokenLogoLookup from 'constants/tokenLogoLookup'
import { checkWarning, WARNING_LEVEL } from 'constants/tokenSafety'
import { chainIdToNetworkName, getNativeLogoURI } from 'lib/hooks/useCurrencyLogoURIs'
import uriToHttp from 'lib/utils/uriToHttp'
import { useCallback, useMemo, useReducer } from 'react'
import { isAddress } from 'utilities/src/addresses'
import { useAppSelector } from 'state/hooks'
import { AppState } from 'state/reducer'
import { ChainId } from '@jaguarswap/sdk-core'

const BAD_SRCS: { [tokenAddress: string]: true } = {}

// Converts uri's into fetchable urls
function parseLogoSources(uris: string[]) {
  const urls: string[] = []
  uris.forEach((uri) => urls.push(...uriToHttp(uri)))
  return urls
}

// Parses uri's, favors non-coingecko images, and improves coingecko logo quality
function prioritizeLogoSources(uris: string[]) {
  const parsedUris = uris.map((uri) => uriToHttp(uri)).flat(1)
  const preferredUris: string[] = []

  // Consolidate duplicate coingecko urls into one fallback source
  let coingeckoUrl: string | undefined = undefined

  parsedUris.forEach((uri) => {
    if (uri.startsWith('https://assets.coingecko')) {
      if (!coingeckoUrl) {
        coingeckoUrl = uri.replace(/\/small\/|\/thumb\//g, '/large/')
      }
    } else {
      preferredUris.push(uri)
    }
  })
  // Places coingecko urls in the back of the source array
  return coingeckoUrl ? [...preferredUris, coingeckoUrl] : preferredUris
}

export function getInitialUrl(address?: string | null, chainId?: number | null, isNative?: boolean, backupImg?: string | null) {
  if (chainId && isNative) return getNativeLogoURI(chainId)

  const networkName = chainId ? chainIdToNetworkName(chainId) : 'xlayer'
  const checksummedAddress = isAddress(address)

  if (checksummedAddress) {
    // FIXME： 替换成主网的logo
    return `https://raw.githubusercontent.com/JaguarX-com/assets/master/blockchains/${networkName}/assets/${checksummedAddress}/logo.png`
  } else {
    return backupImg ?? undefined
  }
}

export default function useAssetLogoSource({
  address,
  chainId,
  isNative,
  primaryImg,
}: {
  address?: string | null
  chainId?: number | null
  isNative?: boolean
  primaryImg?: string | null
}): [string | undefined, () => void] {
  const chainIdState = useAppSelector((state: AppState) => state.application.chainId) ?? ChainId.X1

  const chainIdN = chainId ?? chainIdState
  const hideLogo = Boolean(address && checkWarning(address, chainIdN)?.level === WARNING_LEVEL.BLOCKED)
  const [srcIndex, incrementSrcIndex] = useReducer((n: number) => n + 1, 0)

  const current = useMemo(() => {
    if (hideLogo) return undefined

    if (primaryImg && !BAD_SRCS[primaryImg] && !isNative) return primaryImg

    const initialUrl = getInitialUrl(address, chainIdN, isNative)
    if (initialUrl && !BAD_SRCS[initialUrl]) return initialUrl

    const uris = tokenLogoLookup.getIcons(address, chainIdN) ?? []
    const fallbackSrcs = prioritizeLogoSources(parseLogoSources(uris))
    return fallbackSrcs.find((src) => !BAD_SRCS[src])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rerun when src index changes, denoting a bad src was marked
  }, [address, chainIdN, hideLogo, isNative, primaryImg, srcIndex])

  const nextSrc = useCallback(() => {
    if (current) BAD_SRCS[current] = true
    incrementSrcIndex()
  }, [current])

  return [current, nextSrc]
}
