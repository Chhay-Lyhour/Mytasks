import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowUnownedLegacyTasks1793010000000 implements MigrationInterface {
  name = 'AllowUnownedLegacyTasks1793010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "ownerId" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "ownerId" SET NOT NULL`,
    );
  }
}
