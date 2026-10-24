import { IsBoolean } from 'class-validator';

export class UpdateTaskDto {
  @IsBoolean()
  done!: boolean;
}
