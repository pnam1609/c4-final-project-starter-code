import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { TodosAccess } from '../../dataLayer/todosAccess'
import { getUserId } from '../utils'

const XAWS = AWSXRay.captureAWS(AWS)

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = Number(process.env.SIGNED_URL_EXPIRATION)
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const todosAccess = new TodosAccess()
const logger = createLogger('generateUploadUrl')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId

    logger.info('Generating upload URL:', {
      todoId
    })
    const userId = getUserId(event)

    const uploadUrl = s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: todoId,
      Expires: urlExpiration,
      ACL: 'public-read', 
    })

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
