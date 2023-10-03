import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'
import { createTodo } from '../../businessLogic/todos'

const logger = createLogger('createTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing handler: ', event)

    const userId = getUserId(event)
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    try {
      const newItem = await createTodo(newTodo, userId)
      logger.info('Created: ', newItem)
      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          item: newItem
        })
      }
    } catch (error) {
      logger.info('Error create', error)
      return {
        statusCode: 400,
        body: JSON.stringify({
          error
        })
      }
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
