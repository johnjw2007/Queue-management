/**
 * migrate_to_supabase.js
 * One-time data migration script to populate Supabase PostgreSQL from local seed data.
 * Run using: node migrate_to_supabase.js <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.argv[2] || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.argv[3] || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL and Key are required.');
  console.log('Usage: node migrate_to_supabase.js <SUPABASE_URL> <SUPABASE_KEY>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log('🚀 Starting one-time migration to Supabase PostgreSQL...');

  // 1. Migrate Departments
  const deptsPath = path.join(__dirname, 'src', 'data', 'departments.json');
  const departments = JSON.parse(fs.readFileSync(deptsPath, 'utf8'));
  console.log(`📦 Migrating ${departments.length} departments...`);

  for (const dept of departments) {
    const { error } = await supabase.from('departments').upsert({
      id: dept.id,
      name: dept.name,
      code: dept.code,
    });
    if (error) console.error(`Failed dept ${dept.name}:`, error.message);
  }
  console.log('✅ Departments migrated.');

  // 2. Migrate Cameras
  const camerasPath = path.join(__dirname, 'src', 'data', 'cameras.json');
  const cameras = JSON.parse(fs.readFileSync(camerasPath, 'utf8'));
  console.log(`📦 Migrating ${cameras.length} cameras...`);

  for (const cam of cameras) {
    const { error } = await supabase.from('cameras').upsert({
      id: cam.id,
      name: cam.name,
      location: cam.location,
      stream_type: cam.streamType || 'webcam',
      is_active: cam.isOnline ?? true,
      fps: cam.fps || 30,
      confidence: cam.confidence || 98.6,
    });
    if (error) console.error(`Failed camera ${cam.id}:`, error.message);
  }
  console.log('✅ Cameras migrated.');

  // 3. Migrate Students
  const studentsPath = path.join(__dirname, 'src', 'data', 'students.json');
  const students = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
  console.log(`📦 Migrating ${students.length} students...`);

  for (const stu of students) {
    const { error } = await supabase.from('students').upsert({
      id: stu.id,
      name: stu.name,
      register_number: stu.registerNumber,
      department_id: stu.departmentId || 'DEPT_CS',
      email: stu.email || null,
      phone: stu.phone || null,
      avatar: stu.avatar || null,
      face_photo: stu.facePhoto || stu.avatar || null,
      queue_score: stu.queueScore || 80,
      monthly_reward_points: stu.monthlyRewardPoints || 0,
      max_monthly_reward: stu.maxMonthlyReward || 50,
      weekly_deduction: stu.weeklyDeduction || 0,
      is_eligible_for_reward: (stu.queueScore || 80) >= 90,
      current_queue_status: stu.currentQueueStatus || 'Proper Queue',
      join_date: stu.joinDate || new Date().toISOString().split('T')[0],
    });
    if (error) console.error(`Failed student ${stu.name}:`, error.message);
  }
  console.log('✅ Students migrated.');

  console.log('\n🎉 One-time migration completed successfully!');
}

migrateData().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
