// Runs once on first container start
db = db.getSiblingDB('pinboard-auth');
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db = db.getSiblingDB('pinboard-board');
db.createCollection('boards');
db.createCollection('notes');
db.boards.createIndex({ ownerId: 1 });
db.notes.createIndex({ boardId: 1, isArchived: 1 });
db.notes.createIndex({ boardId: 1, zIndex: 1 });

print('✅ MongoDB initialized — pinboard-auth and pinboard-board databases ready');
