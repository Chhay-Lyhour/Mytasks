import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Recipe } from './recipe.entity.js';
import { RecipesService } from './recipes.service.js';

describe('RecipesService', () => {
  let service: RecipesService;
  const recipesRepository = {
    find: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: getRepositoryToken(Recipe),
          useValue: recipesRepository,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  it('lists recipes in ID order', async () => {
    const recipes = [
      {
        id: 1,
        name: 'Tomato soup',
        ingredients: 'Tomatoes, stock',
        isFavorite: false,
      },
    ];
    recipesRepository.find.mockResolvedValue(recipes);

    await expect(service.findAll()).resolves.toEqual(recipes);
    expect(recipesRepository.find).toHaveBeenCalledWith({
      order: { id: 'ASC' },
    });
  });

  it('creates a recipe with isFavorite defaulting to false', async () => {
    const recipe = {
      id: 2,
      name: 'Pancakes',
      ingredients: 'Flour, eggs, milk',
      isFavorite: false,
    } satisfies Partial<Recipe>;
    recipesRepository.create.mockReturnValue(recipe);
    recipesRepository.save.mockResolvedValue(recipe);

    await expect(
      service.create({ name: 'Pancakes', ingredients: 'Flour, eggs, milk' }),
    ).resolves.toEqual(recipe);
    expect(recipesRepository.create).toHaveBeenCalledWith({
      name: 'Pancakes',
      ingredients: 'Flour, eggs, milk',
      isFavorite: false,
    });
    expect(recipesRepository.save).toHaveBeenCalledWith(recipe);
  });

  it('throws NotFoundException when a recipe does not exist', async () => {
    recipesRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not delete a missing recipe', async () => {
    recipesRepository.findOneBy.mockResolvedValue(null);

    await expect(service.remove(404)).rejects.toBeInstanceOf(NotFoundException);
    expect(recipesRepository.delete).not.toHaveBeenCalled();
  });
});
