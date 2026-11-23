const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Role = require('../src/models/Role');
const Permission = require('../src/models/Permission');
const RolePermission = require('../src/models/RolePermission');
const College = require('../src/models/College');
const Department = require('../src/models/Department');
const { PERMISSIONS } = require('../src/security/permissions');
const { ROLES, ROLE_PERMISSIONS_MATRIX } = require('../src/security/rbac');

async function seedEnterpriseDb() {
  const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartface_dev';
  console.log('[DB Init] Connecting to MongoDB...');
  await mongoose.connect(mongoUrl);
  console.log('✅ MongoDB connected.');

  // 1. Seed Permissions
  console.log('[RBAC] Seeding Permissions...');
  const permMap = {};
  for (const [key, code] of Object.entries(PERMISSIONS)) {
    const moduleName = code.split('.')[0].toUpperCase();
    const perm = await Permission.findOneAndUpdate(
      { code },
      { code, name: key.replace(/_/g, ' '), module: moduleName },
      { upsert: true, new: true }
    );
    permMap[code] = perm._id;
  }
  console.log(`✅ Seeded ${Object.keys(permMap).length} granular permissions.`);

  // 2. Seed Roles and RolePermission mappings
  console.log('[RBAC] Seeding Roles and RolePermissions...');
  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS_MATRIX)) {
    const role = await Role.findOneAndUpdate(
      { name: roleName },
      { name: roleName, description: `System ${roleName} role`, is_system: true },
      { upsert: true, new: true }
    );

    for (const permCode of permissions) {
      const permId = permMap[permCode];
      if (permId) {
        await RolePermission.findOneAndUpdate(
          { role_id: role._id, permission_id: permId },
          { role_id: role._id, permission_id: permId },
          { upsert: true }
        );
      }
    }
  }
  console.log('✅ Roles and RolePermission matrices initialized.');

  // 3. Seed Default College & Department for multi-institution readiness
  console.log('[Hierarchy] Initializing Default College & Department...');
  const defaultCollege = await College.findOneAndUpdate(
    { code: 'REC' },
    { name: 'Rajalakshmi Engineering College', code: 'REC', address: 'Chennai, India', domain: 'rec.edu' },
    { upsert: true, new: true }
  );

  await Department.findOneAndUpdate(
    { college_id: defaultCollege._id, code: 'CSE' },
    { college_id: defaultCollege._id, name: 'Computer Science and Engineering', code: 'CSE' },
    { upsert: true }
  );
  console.log('✅ College and Department hierarchy initialized.');

  await mongoose.disconnect();
  console.log('🎉 Enterprise Database initialization completed successfully.');
}

if (require.main === module) {
  seedEnterpriseDb().catch((err) => {
    console.error('❌ Enterprise DB seed error:', err);
    process.exit(1);
  });
}

module.exports = { seedEnterpriseDb };
