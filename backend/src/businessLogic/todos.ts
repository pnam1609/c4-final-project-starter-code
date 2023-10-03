import { Key } from 'aws-sdk/clients/cloudformation'
import { TodosAccess } from '../dataLayer/todosAccess'
import { AttachmentUtils } from '../helpers/attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import { AttachmentAccess } from '../fileLayer/attachmentAccess'
// import * as createError from 'http-errors'

// TODO: Implement businessLogic
// const logger = createLogger('TodosAccess')
const attachmentUtils = new AttachmentUtils()
const todosAccess = new TodosAccess()
const attachmentAccess = new AttachmentAccess();

// export const getTodosForUser = async (userId: string) => {
//   return todosAccess.getAllTodos(userId)
// }

export async function getTodosForUser(
  userId: string,
  nextKey: Key,
  limit: number
) {
  const items = await todosAccess.getAllTodos(userId, nextKey, limit)

  for (let item of items.todoItems) {
    if (!!item['attachmentUrl'])
      item['attachmentUrl'] = attachmentAccess.getDownloadUrl(
        item['attachmentUrl']
      )
  }

  return items
}

export async function createTodo(
  newTodo: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()
  const s3AttachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
  const newItem = {
    userId,
    todoId,
    createdAt,
    done: false,
    attachment: s3AttachmentUrl,
    ...newTodo
  }
  return await todosAccess.createTodo(newItem)
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
) {
  const validTodo = await todosAccess.getTodo(userId, todoId)

  if (!validTodo) {
    throw new Error('400')
  }

  return await todosAccess.updateTodo(userId, todoId, updatedTodo)
}

export const deleteTodo = async (userId: string, todoId: string) => {
  // const validTodo = await todosAccess.getTodo(userId, todoId)

  // if (!validTodo) {
  //   throw new Error('400')
  // }

  return todosAccess.deleteTodo(userId, todoId)
}
