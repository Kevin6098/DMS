const bcrypt = require('bcrypt');
const { executeQuery } = require('./config/database');

async function fixPasswords() {
  try {
    console.log('Generating password hashes...');
    
    // Generate proper password hashes
    const adminPassword = 'admin123';
    const memberPassword = 'member123';
    
    const adminHash = await bcrypt.hash(adminPassword, 12);
    const memberHash = await bcrypt.hash(memberPassword, 12);
    
    console.log('Admin hash:', adminHash);
    console.log('Member hash:', memberHash);
    
    // Update platform owner password
    console.log('\nUpdating platform owner password...');
    const ownerResult = await executeQuery(
      'UPDATE users SET password_hash = ? WHERE email = ? AND role = ?',
      [adminHash, 'owner@taskinsight.com', 'platform_owner']
    );
    
    if (ownerResult.success) {
      console.log('✓ Platform owner password updated');
    } else {
      console.log('✗ Failed to update platform owner:', ownerResult.error);
    }
    
    // Update organization admin password
    console.log('Updating organization admin password...');
    const adminResult = await executeQuery(
      'UPDATE users SET password_hash = ? WHERE email = ? AND role = ?',
      [adminHash, 'admin@demo.com', 'organization_admin']
    );
    
    if (adminResult.success) {
      console.log('✓ Organization admin password updated');
    } else {
      console.log('✗ Failed to update org admin:', adminResult.error);
    }
    
    // Update member password
    console.log('Updating member password...');
    const memberResult = await executeQuery(
      'UPDATE users SET password_hash = ? WHERE email = ? AND role = ?',
      [memberHash, 'member@demo.com', 'member']
    );
    
    if (memberResult.success) {
      console.log('✓ Member password updated');
    } else {
      console.log('✗ Failed to update member:', memberResult.error);
    }
    
    console.log('\n✅ Password update complete!');
    console.log('\nLogin credentials:');
    console.log('Platform Owner: owner@taskinsight.com / admin123');
    console.log('Org Admin: admin@demo.com / admin123');
    console.log('Member: member@demo.com / member123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing passwords:', error);
    process.exit(1);
  }
}

fixPasswords();

