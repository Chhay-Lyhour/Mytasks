import { IsByteLength, IsEmail, IsString } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsByteLength(8, 72)
  password!: string;
}
