import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskPriority1792813906344 implements MigrationInterface {
    name = 'AddTaskPriority1792813906344'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "priority" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "priority"`);
    }

}
