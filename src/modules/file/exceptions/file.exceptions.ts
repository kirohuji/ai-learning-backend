import { HttpStatus } from '@nestjs/common';
import { FileException } from './file.exception';
import {
  FILE_ERROR_MESSAGES,
  FILE_ERROR_CODES,
} from './file-exception.constants';

export class FileNotFoundException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_NOT_FOUND) {
    super(message, HttpStatus.NOT_FOUND, FILE_ERROR_CODES.FILE_NOT_FOUND);
  }
}

export class FileUploadFailedException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_UPLOAD_FAILED) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      FILE_ERROR_CODES.FILE_UPLOAD_FAILED,
    );
  }
}

export class FileDownloadFailedException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_DOWNLOAD_FAILED) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      FILE_ERROR_CODES.FILE_DOWNLOAD_FAILED,
    );
  }
}

export class FileDeleteFailedException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_DELETE_FAILED) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      FILE_ERROR_CODES.FILE_DELETE_FAILED,
    );
  }
}

export class FileListFailedException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_LIST_FAILED) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      FILE_ERROR_CODES.FILE_LIST_FAILED,
    );
  }
}

export class InvalidFileDataException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.INVALID_FILE_DATA) {
    super(message, HttpStatus.BAD_REQUEST, FILE_ERROR_CODES.INVALID_FILE_DATA);
  }
}

export class FileAlreadyExistsException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_ALREADY_EXISTS) {
    super(message, HttpStatus.CONFLICT, FILE_ERROR_CODES.FILE_ALREADY_EXISTS);
  }
}

export class FileAccessDeniedException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_ACCESS_DENIED) {
    super(message, HttpStatus.FORBIDDEN, FILE_ERROR_CODES.FILE_ACCESS_DENIED);
  }
}

export class FileValidationException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_VALIDATION_FAILED) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      FILE_ERROR_CODES.FILE_VALIDATION_FAILED,
    );
  }
}

export class InvalidFileTypeException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.INVALID_FILE_TYPE) {
    super(message, HttpStatus.BAD_REQUEST, FILE_ERROR_CODES.INVALID_FILE_TYPE);
  }
}

export class FileSizeExceededException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_SIZE_EXCEEDED) {
    super(message, HttpStatus.BAD_REQUEST, FILE_ERROR_CODES.FILE_SIZE_EXCEEDED);
  }
}

export class FileProcessingFailedException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_PROCESSING_FAILED) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      FILE_ERROR_CODES.FILE_PROCESSING_FAILED,
    );
  }
}

export class FileStorageErrorException extends FileException {
  constructor(message = FILE_ERROR_MESSAGES.FILE_STORAGE_ERROR) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      FILE_ERROR_CODES.FILE_STORAGE_ERROR,
    );
  }
}
