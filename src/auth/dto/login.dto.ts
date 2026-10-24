import { IsByteLength, IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsByteLength(8, 72)
  password!: string;
}
