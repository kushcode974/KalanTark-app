const { PrismaClient: SQLiteClient } = require('@prisma/client-sqlite');
const { PrismaClient: NeonClient } = require('@prisma/client');

const sqlite = new SQLiteClient();
const neon = new NeonClient();

async function migrateData() {
    console.log("Starting data migration from SQLite to Neon...");

    // 1. Users
    const users = await sqlite.user.findMany();
    if (users.length > 0) {
        await neon.user.createMany({ data: users, skipDuplicates: true });
        console.log(`Migrated ${users.length} Users.`);
    }

    // 2. Categories
    const categories = await sqlite.category.findMany();
    if (categories.length > 0) {
        await neon.category.createMany({ data: categories, skipDuplicates: true });
        console.log(`Migrated ${categories.length} Categories.`);
    }

    // 3. Sessions
    const sessions = await sqlite.session.findMany();
    if (sessions.length > 0) {
        await neon.session.createMany({ data: sessions, skipDuplicates: true });
        console.log(`Migrated ${sessions.length} Sessions.`);
    }

    // 4. Targets
    const targets = await sqlite.target.findMany();
    if (targets.length > 0) {
        await neon.target.createMany({ data: targets, skipDuplicates: true });
        console.log(`Migrated ${targets.length} Targets.`);
    }

    // 5. Streaks
    const streaks = await sqlite.streak.findMany();
    if (streaks.length > 0) {
        await neon.streak.createMany({ data: streaks, skipDuplicates: true });
        console.log(`Migrated ${streaks.length} Streaks.`);
    }

    // 6. Cycle Notes
    const cycleNotes = await sqlite.cycleNote.findMany();
    if (cycleNotes.length > 0) {
        await neon.cycleNote.createMany({ data: cycleNotes, skipDuplicates: true });
        console.log(`Migrated ${cycleNotes.length} Cycle Notes.`);
    }

    console.log("🎉 Migration Complete! Your old account is now fully on Neon PostgreSQL.");
}

migrateData()
    .catch(console.error)
    .finally(async () => {
        await sqlite.$disconnect();
        await neon.$disconnect();
    });
