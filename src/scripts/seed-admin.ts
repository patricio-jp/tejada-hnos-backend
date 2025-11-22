import 'reflect-metadata';
import { DatabaseService } from '@services/database.service';
import { User } from '@entities/user.entity';
import { UserRole } from '@/enums';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para crear un usuario administrador inicial
 * Ejecutar con: npm run seed:admin
 */
async function seedAdmin() {
  try {
    console.log('🌱 Iniciando seed de usuario administrador...');

    // Inicializar conexión a la base de datos
    await DatabaseService.initialize();

    const userRepository = DatabaseService.getDataSource().getRepository(User);

    // Verificar si ya existe un usuario admin
    const existingAdmin = await userRepository.findOne({
      where: { email: process.env.SEED_ADMIN_EMAIL! },
    });

    if (existingAdmin) {
      console.log('⚠️  El usuario administrador ya existe.');
      process.exit(0);
    }

    // Crear usuario admin
    const adminUser = new User();
    adminUser.email = process.env.SEED_ADMIN_EMAIL!;
    adminUser.name = process.env.SEED_ADMIN_NAME!;
    adminUser.lastName = process.env.SEED_ADMIN_LASTNAME!;
    adminUser.role = UserRole.ADMIN;
    adminUser.passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD!, 10);
    await userRepository.save(adminUser);

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('   Email: ' + process.env.SEED_ADMIN_EMAIL!);
    console.log('   Password: ' + process.env.SEED_ADMIN_PASSWORD!);
    console.log('   Rol: ADMIN');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error);
    process.exit(1);
  }
}

seedAdmin();
