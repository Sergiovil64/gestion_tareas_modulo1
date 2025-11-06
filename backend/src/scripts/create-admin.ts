/**
 * Script to create the first admin user
 * Usage: ts-node src/scripts/create-admin.ts
 */

import bcrypt from 'bcryptjs';
import { sequelize } from '../models/index';
import User from '../models/user';
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createAdmin() {
  try {
    console.log('\n='.repeat(60));
    console.log('Creación de Admin');
    console.log('='.repeat(60) + '\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('Conectado a la DB\n');

    // Get admin details
    const name = await question('Nombre del administrador: ');
    const email = await question('Email del administrador: ');
    const password = await question('Contraseña (min 12 caracteres, @ $ ! % * ? &): ');

    if (!name || !email || !password) {
      console.error('\nError: Todos los campos son obligatorios');
      rl.close();
      process.exit(1);
    }

    if (password.length < 12) {
      console.error('\nError: La contraseña debe tener al menos 12 caracteres');
      rl.close();
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      const update = await question('\nUsuario ya existe. ¿Actualizarlo a ADMIN? (s/n): ');
      
      if (update.toLowerCase() === 's' || update.toLowerCase() === 'si') {
        await existingUser.update({ 
          role: 'ADMIN',
          isActive: true 
        });
        console.log('\nUsuario actualizado a rol ADMIN exitosamente!');
        console.log('\nDetalles:');
        console.log(`  - ID: ${existingUser.id}`);
        console.log(`  - Nombre: ${existingUser.name}`);
        console.log(`  - Email: ${existingUser.email}`);
        console.log(`  - Rol: ${existingUser.role}`);
      } else {
        console.log('\nOperación cancelada');
      }
      
      rl.close();
      await sequelize.close();
      process.exit(0);
    }

    // Hash password
    console.log('\nHasheando contraseña...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    console.log('Creando usuario administrador...');
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      loginAttempts: 0
    });

    console.log('\nAdministrador creado exitosamente!\n');
    console.log('Detalles:');
    console.log(`  - ID: ${admin.id}`);
    console.log(`  - Nombre: ${admin.name}`);
    console.log(`  - Email: ${admin.email}`);
    console.log(`  - Rol: ${admin.role}`);
    console.log(`  - Activo: ${admin.isActive}`);
    
    console.log('\nCredenciales de acceso:');
    console.log(`  - Email: ${email}`);
    console.log(`  - Contraseña: (la que ingresaste)`);
    
    console.log('\nAhora puedes iniciar sesión con estas credenciales en:');
    console.log(`  POST ${process.env.PORT || 3000}/api/auth/login`);
    
    console.log('\n' + '='.repeat(60) + '\n');

    rl.close();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\nError al crear administrador:', error);
    rl.close();
    await sequelize.close();
    process.exit(1);
  }
}

// Run the script
createAdmin();

