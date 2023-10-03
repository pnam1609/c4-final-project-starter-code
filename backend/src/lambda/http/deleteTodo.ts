import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('deleteTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing handler: ', event)
    const todoId = event.pathParameters.todoId
    // TODO: Remove a TODO item by id

    const userId = getUserId(event)

    try {
      await deleteTodo(userId, todoId)
      logger.info('Success deleted: ', todoId)

      return {
        statusCode: 202,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: 'Successfully Deleted'
      }
    } catch (error) {
      logger.info('Error delete', error)
      return {
        statusCode: 400,
        body: JSON.stringify({
          error
        })
      }
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
