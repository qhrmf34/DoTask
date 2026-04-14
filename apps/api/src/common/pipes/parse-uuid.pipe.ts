import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ParseUuidPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException(`'${value}'는 올바른 UUID 형식이 아닙니다.`);
    }
    return value;
  }
}
