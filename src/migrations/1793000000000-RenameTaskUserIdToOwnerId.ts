import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTaskUserIdToOwnerId1793000000000 implements MigrationInterface {
  name = 'RenameTaskUserIdToOwnerId1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" RENAME COLUMN "userId" TO "ownerId"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_tasks_userId" RENAME TO "IDX_tasks_ownerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_owner"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_tasks_ownerId" RENAME TO "IDX_tasks_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" RENAME COLUMN "ownerId" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
