import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ingredients?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
