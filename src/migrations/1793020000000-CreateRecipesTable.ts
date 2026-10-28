import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecipesTable1793020000000 implements MigrationInterface {
  name = 'CreateRecipesTable1793020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "recipes" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "ingredients" text NOT NULL, "isFavorite" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_recipes_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "recipes"`);
  }
}
