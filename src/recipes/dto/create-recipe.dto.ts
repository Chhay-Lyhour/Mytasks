import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  ingredients!: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
