import { HttpStatus } from '@nestjs/common';
import { CONVERSATION_ERRORS } from '../constants/conversation.constants';
import { ConversationException } from './conversation.exception';
import {
  CONVERSATION_ERROR_MESSAGES,
  CONVERSATION_ERROR_CODES,
} from './conversation-exception.constants';

export class ConversationNotFoundException extends ConversationException {
  constructor(message = CONVERSATION_ERROR_MESSAGES.CONVERSATION_NOT_FOUND) {
    super(
      message,
      HttpStatus.NOT_FOUND,
      CONVERSATION_ERROR_CODES.CONVERSATION_NOT_FOUND,
    );
  }
}

export class ConversationUnauthorizedException extends ConversationException {
  constructor(message = '无权访问该会话') {
    super(message, HttpStatus.UNAUTHORIZED, CONVERSATION_ERRORS.UNAUTHORIZED);
  }
}

export class InvalidMessageException extends ConversationException {
  constructor(message = '无效的消息内容') {
    super(message, HttpStatus.BAD_REQUEST, CONVERSATION_ERRORS.INVALID_MESSAGE);
  }
}

export class TooManyMessagesException extends ConversationException {
  constructor(message = '消息发送过于频繁，请稍后再试') {
    super(
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      CONVERSATION_ERRORS.TOO_MANY_MESSAGES,
    );
  }
}

export class ConversationLimitExceededException extends ConversationException {
  constructor(message = '已达到会话数量上限') {
    super(message, HttpStatus.BAD_REQUEST, CONVERSATION_ERRORS.LIMIT_EXCEEDED);
  }
}

export class ConversationCreateFailedException extends ConversationException {
  constructor(
    message = CONVERSATION_ERROR_MESSAGES.CONVERSATION_CREATE_FAILED,
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      CONVERSATION_ERROR_CODES.CONVERSATION_CREATE_FAILED,
    );
  }
}

export class ConversationUpdateFailedException extends ConversationException {
  constructor(
    message = CONVERSATION_ERROR_MESSAGES.CONVERSATION_UPDATE_FAILED,
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      CONVERSATION_ERROR_CODES.CONVERSATION_UPDATE_FAILED,
    );
  }
}

export class ConversationDeleteFailedException extends ConversationException {
  constructor(
    message = CONVERSATION_ERROR_MESSAGES.CONVERSATION_DELETE_FAILED,
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      CONVERSATION_ERROR_CODES.CONVERSATION_DELETE_FAILED,
    );
  }
}

export class ConversationListFailedException extends ConversationException {
  constructor(message = CONVERSATION_ERROR_MESSAGES.CONVERSATION_LIST_FAILED) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      CONVERSATION_ERROR_CODES.CONVERSATION_LIST_FAILED,
    );
  }
}

export class InvalidConversationDataException extends ConversationException {
  constructor(message = CONVERSATION_ERROR_MESSAGES.INVALID_CONVERSATION_DATA) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      CONVERSATION_ERROR_CODES.INVALID_CONVERSATION_DATA,
    );
  }
}

export class ConversationAlreadyExistsException extends ConversationException {
  constructor(
    message = CONVERSATION_ERROR_MESSAGES.CONVERSATION_ALREADY_EXISTS,
  ) {
    super(
      message,
      HttpStatus.CONFLICT,
      CONVERSATION_ERROR_CODES.CONVERSATION_ALREADY_EXISTS,
    );
  }
}

export class ConversationAccessDeniedException extends ConversationException {
  constructor(
    message = CONVERSATION_ERROR_MESSAGES.CONVERSATION_ACCESS_DENIED,
  ) {
    super(
      message,
      HttpStatus.FORBIDDEN,
      CONVERSATION_ERROR_CODES.CONVERSATION_ACCESS_DENIED,
    );
  }
}

export class ConversationValidationException extends ConversationException {
  constructor(
    message = CONVERSATION_ERROR_MESSAGES.CONVERSATION_VALIDATION_FAILED,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      CONVERSATION_ERROR_CODES.CONVERSATION_VALIDATION_FAILED,
    );
  }
}

export class MessageSendFailedException extends ConversationException {
  constructor(message = CONVERSATION_ERROR_MESSAGES.MESSAGE_SEND_FAILED) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      CONVERSATION_ERROR_CODES.MESSAGE_SEND_FAILED,
    );
  }
}

export class MessageNotFoundException extends ConversationException {
  constructor(message = CONVERSATION_ERROR_MESSAGES.MESSAGE_NOT_FOUND) {
    super(
      message,
      HttpStatus.NOT_FOUND,
      CONVERSATION_ERROR_CODES.MESSAGE_NOT_FOUND,
    );
  }
}

export class InvalidMessageTypeException extends ConversationException {
  constructor(message = CONVERSATION_ERROR_MESSAGES.INVALID_MESSAGE_TYPE) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      CONVERSATION_ERROR_CODES.INVALID_MESSAGE_TYPE,
    );
  }
}
