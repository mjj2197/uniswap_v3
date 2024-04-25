import { ApolloClient, HttpLink, concat, ApolloLink, InMemoryCache } from '@apollo/client'
import { createSubscriptionLink } from 'utilities/src/apollo/SubscriptionLink'
import { splitSubscription } from 'utilities/src/apollo/splitSubscription'
import { ChainId } from '@jaguarswap/sdk-core'

import store from 'state/index'

const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [ChainId.X1]: 'https://main-subgraph.jaguarex.com/subgraphs/name/jaguarswap/uniswap-v3',
  [ChainId.X1_TESTNET]: 'https://subgraph.jaguarex.com/subgraphs/name/jaguarswap/uniswap-v3',
}

const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[ChainId.X1] })
// This middleware will allow us to dynamically update the uri for the requests based off chainId
// For more information: https://www.apollographql.com/docs/react/networking/advanced-http-networking/

const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  const chainId = store.getState().application.chainId

  operation.setContext(() => ({
    uri: chainId && CHAIN_SUBGRAPH_URL[chainId] ? CHAIN_SUBGRAPH_URL[chainId] : CHAIN_SUBGRAPH_URL[ChainId.X1],
  }))

  return forward(operation)
})
export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  link: concat(authMiddleware, httpLink),
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://www.jaguarex.com',
  },
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        // Tokens are cached by their chain/address (see Query.fields.token, above).
        // In any query for `token` or `tokens`, you *must* include `chain` and `address` fields in order
        // to properly normalize the result in the cache.
        keyFields: ['id'],
        fields: {
          id: {
            // Always cache lowercased for consistency (backend sometimes returns checksummed).
            read(id: string | null): string | null {
              return id?.toLowerCase() ?? null
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

// This is done after creating the client so that client may be passed to `createSubscriptionLink`.
const subscriptionLink = createSubscriptionLink({ uri: CHAIN_SUBGRAPH_URL[ChainId.X1], token: '' }, apolloClient)
apolloClient.setLink(concat(authMiddleware, splitSubscription(subscriptionLink, httpLink)))
