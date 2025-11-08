/**
 * Script to create the first admin user
 * Usage: ts-node src/scripts/create-admin.ts
 */

import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { sequelize } from '../models/index';
import User from '../models/user';
import PasswordHistory from '../models/passwordHistory';
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

    // Calculate password expiration (90 days)
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 90);

    // Generate MFA secret (mandatory)
    console.log('Generando configuración MFA...');
    const mfaSecret = speakeasy.generateSecret({
      name: `Gestión de Tareas (${email})`,
      issuer: 'Gestión de Tareas',
      length: 32
    });

    // Generate backup codes
    const generateBackupCodes = (): string[] => {
      const codes: string[] = [];
      for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
      }
      return codes;
    };

    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Create admin user
    console.log('Creando usuario administrador...');
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      loginAttempts: 0,
      passwordChangedAt: new Date(),
      passwordExpiresAt: passwordExpiresAt,
      mustChangePassword: false,
      mfaEnabled: false, // Will be enabled after verification
      mfaSecret: mfaSecret.base32,
      mfaBackupCodes: JSON.stringify(hashedBackupCodes)
    });

    // Save password history
    await PasswordHistory.create({
      userId: admin.id,
      passwordHash: hashedPassword,
      changedAt: new Date()
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(mfaSecret.otpauth_url!);

    console.log('\n\x1b[32m✓\x1b[0m Administrador creado exitosamente!\n');
    console.log('Detalles:');
    console.log(`  - ID: ${admin.id}`);
    console.log(`  - Nombre: ${admin.name}`);
    console.log(`  - Email: ${admin.email}`);
    console.log(`  - Rol: ${admin.role}`);
    console.log(`  - Activo: ${admin.isActive}`);
    
    console.log('\n\x1b[33m⚠ IMPORTANTE: MFA es obligatorio\x1b[0m\n');
    console.log('Configuración MFA:');
    console.log(`  - Secreto: ${mfaSecret.base32}`);
    console.log(`  - Código QR guardado en: qr-code-admin.png`);
    
    // Save QR code to file
    const fs = require('fs');
    const base64Data = qrCodeUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('qr-code-admin.png', base64Data, 'base64');
    console.log('\n  Para configurar MFA:');
    console.log('  1. Abra la imagen qr-code-admin.png');
    console.log('  2. Escanee el código QR con Google Authenticator, Authy, o similar');
    console.log('  3. Guarde estos códigos de respaldo en un lugar seguro:');
    console.log('');
    backupCodes.forEach((code, index) => {
      console.log(`     ${index + 1}. ${code}`);
    });
    console.log('');
    console.log('  4. Verifique la configuración MFA usando:');
    console.log(`     POST http://localhost:${process.env.PORT || 3000}/api/auth/verify-mfa-setup`);
    console.log('     Body: { "email": "' + email + '", "token": "CODIGO_DE_6_DIGITOS" }');
    console.log('');
    console.log('  5. Una vez verificado, podrá iniciar sesión con email, contraseña y código MFA');
    
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

