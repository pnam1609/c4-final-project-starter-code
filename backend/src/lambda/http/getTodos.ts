import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { getTodosForUser } from '../../businessLogic/todos'
// import { getAllTodos } from '../../businessLogic/todos'
import { getUserId } from '../utils'

const logger = createLogger('getTodos')

// TODO: Get all TODO items for a current user
// export const handler = middy(
//   async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
//     logger.info('Process Event', event)

//     const userId = getUserId(event)
//     try {
//       const todos = await getTodosForUser(userId)
//       return {
//         statusCode: 200,
//         body: JSON.stringify(todos)
//       }
//     } catch (error) {
//       logger.info('Error get all', error)
//       return {
//         statusCode: 400,
//         body: JSON.stringify({
//           error
//         })
//       }
//     }
//   }
// )

function getQueryParameter(event, name) {
  const queryParams = event.queryStringParameters
  if (!queryParams) {
    return undefined
  }

  return queryParams[name]
}

export function parseNextKeyParameter(event) {
  const nextKeyStr = getQueryParameter(event, 'nextKey')
  if (!nextKeyStr) {
    return undefined
  }

  const uriDecoded = decodeURIComponent(nextKeyStr)
  return JSON.parse(uriDecoded)
}
export function parseLimitParameter(event) {
  const limitStr = getQueryParameter(event, 'limit')
  if (!limitStr) {
    return undefined
  }

  const limit = parseInt(limitStr, 10)
  if (limit <= 0) {
    throw new Error('Limit should be positive')
  }

  return limit
}

export function encodeNextKey(lastEvaluatedKey) {
  if (!lastEvaluatedKey) {
    return null
  }

  return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // TODO: Get all TODO items for a current user
    logger.info('Processing event: ', event)

    let nextKey // Next key to continue scan operation if necessary
    let limit // Maximum number of elements to return

    try {
      // Parse query parameters
      nextKey = parseNextKeyParameter(event)
      limit = parseLimitParameter(event) || 20
    } catch (e) {
      logger.error('Failed to parse query parameters: ', e.message)
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid parameters'
        })
      }
    }

    const userId = getUserId(event)
    const items = await getTodosForUser(userId, nextKey, limit)

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: items.todoItems,
        // Encode the JSON object so a client can return it in a URL as is
        nextKey: encodeNextKey(items.lastEvaluatedKey)
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
