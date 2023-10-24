import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { TodosAccess } from '../../dataLayer/todosAccess'
import { getUserId } from '../utils'
import { AttachmentAccess } from '../../fileLayer/attachmentAccess'

const bucketName = process.env.ATTACHMENT_S3_BUCKET

const todosAccess = new TodosAccess()
const attachmentAccess = new AttachmentAccess()
const logger = createLogger('generateUploadUrl')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId

    logger.info('Generating upload URL:', {
      todoId
    })
    const userId = getUserId(event)

    const uploadUrl = attachmentAccess.generateImage(todoId)
    logger.info('uploadUrl', uploadUrl)

    try {
      await todosAccess.saveImgUrl(userId, todoId, bucketName)

      logger.info(`Success upload for todoID: ${todoId}`)

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          uploadUrl: uploadUrl
        })
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
