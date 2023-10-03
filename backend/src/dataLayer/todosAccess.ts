import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
// import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'
import { Key } from 'aws-sdk/clients/cloudformation'
// import { TodoUpdate } from '../models/TodoUpdate'

const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('todoAccess')

export interface PageableTodoItems {
  todoItems: TodoItem[]
  lastEvaluatedKey: Key
}

// TODO: Implement the dataLayer logic

export class TodosAccess {
  constructor(
    private readonly docClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly userIdIndex = process.env.USER_ID_INDEX,
    private readonly bucketName: string = process.env.ATTACHMENT_S3_BUCKET,
    private readonly s3: AWS.S3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly urlExpiration: number = parseInt(
      process.env.SIGNED_URL_EXPIRATION
    )
  ) {}

  async getTodo(userId: string, todoId: string): Promise<TodoItem> {
    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: { userId, todoId }
      })
      .promise()

    return result.Item as TodoItem
  }

  async getAllTodos(
    userId: string,
    nextKey: Key,
    limit: number
  ): Promise<PageableTodoItems> {
    console.log('Getting all todos of a user')

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.userIdIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: nextKey
      })
      .promise()

    const items = result.Items as TodoItem[]
    return { todoItems: items, lastEvaluatedKey: result.LastEvaluatedKey }
  }

  async createTodo(newItem: TodoItem): Promise<TodoItem> {
    logger.info(`Creating new todo item.Data Item: ${newItem}`)

    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: newItem
      })
      .promise()

    return newItem
  }

  async updateTodo(
    userId: string,
    todoId: string,
    updatedTodo: TodoUpdate
  ): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { userId, todoId },
        UpdateExpression: 'set #name = :n, dueDate=:dueDate, done=:done',
        ExpressionAttributeValues: {
          ':n': updatedTodo.name,
          ':dueDate': updatedTodo.dueDate,
          ':done': updatedTodo.done
        },
        ExpressionAttributeNames: { '#name': 'name' },
        ReturnValues: 'NONE'
      })
      .promise()
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: { userId, todoId }
      })
      .promise()
  }

  getUploadUrl(imageId: string): string {
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: imageId,
      Expires: this.urlExpiration
    })
  }

  async saveImgUrl(
    userId: string,
    todoId: string,
    bucketName: string
  ): Promise<void> {
    try {
      await this.docClient
        .update({
          TableName: this.todosTable,
          Key: { userId, todoId },
          ConditionExpression: 'attribute_exists(todoId)',
          UpdateExpression: 'set attachmentUrl = :attachmentUrl',
          ExpressionAttributeValues: {
            ':attachmentUrl': todoId
          }
          // `https://${bucketName}.s3.amazonaws.com/${}`
        })
        .promise()
      logger.info(
        `Upload successfully image. Link: https://${bucketName}.s3.amazonaws.com/${todoId}`
      )
    } catch (error) {
      logger.error(error)
    }
  }
}
