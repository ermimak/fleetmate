import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDepartmentEntity1734472923000 implements MigrationInterface {
    name = 'CreateDepartmentEntity1734472923000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'departments',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isUnique: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'code',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'authorityId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'departments',
            new TableForeignKey({
                columnNames: ['authorityId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('departments');
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('authorityId') !== -1);
        await queryRunner.dropForeignKey('departments', foreignKey);
        await queryRunner.dropTable('departments');
    }
}
