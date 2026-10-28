import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecipeDto } from './dto/create-recipe.dto.js';
import { UpdateRecipeDto } from './dto/update-recipe.dto.js';
import { Recipe } from './recipe.entity.js';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipesRepository: Repository<Recipe>,
  ) {}

  findAll(): Promise<Recipe[]> {
    return this.recipesRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Recipe> {
    const recipe = await this.recipesRepository.findOneBy({ id });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} was not found`);
    }
    return recipe;
  }

  async create(createRecipeDto: CreateRecipeDto): Promise<Recipe> {
    const recipe = this.recipesRepository.create({
      name: createRecipeDto.name,
      ingredients: createRecipeDto.ingredients,
      isFavorite: createRecipeDto.isFavorite ?? false,
    });
    return this.recipesRepository.save(recipe);
  }

  async update(id: number, changes: UpdateRecipeDto): Promise<Recipe> {
    const recipe = await this.findOne(id);
    Object.assign(recipe, changes);
    return this.recipesRepository.save(recipe);
  }

  async remove(id: number): Promise<Recipe> {
    const recipe = await this.findOne(id);
    await this.recipesRepository.delete({ id });
    return recipe;
  }
}
