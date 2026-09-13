export function up(pgm) {
  pgm.sql(`
    CREATE TABLE users (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE rooms (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      code VARCHAR(6) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      topic VARCHAR(100) NOT NULL,
      owner_id INTEGER NOT NULL,

      FOREIGN KEY (owner_id)
        REFERENCES users(id)
    );

    CREATE TABLE room_members (
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (user_id, room_id),

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE
    );

    CREATE INDEX idx_room_members_room_id
    ON room_members(room_id);

    CREATE TABLE messages (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX idx_messages_room_id
    ON messages(room_id);

    CREATE TABLE polls (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      room_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      question TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

      FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE TABLE poll_options (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      poll_id INTEGER NOT NULL,
      option_text VARCHAR(255) NOT NULL,

      FOREIGN KEY (poll_id)
        REFERENCES polls(id)
        ON DELETE CASCADE,

      UNIQUE (poll_id, id)
    );

    CREATE INDEX idx_poll_options_poll_id
    ON poll_options(poll_id);

    CREATE TABLE poll_votes (
      poll_id INTEGER NOT NULL,
      option_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      voted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (poll_id, user_id),

      FOREIGN KEY (poll_id)
        REFERENCES polls(id)
        ON DELETE CASCADE,

      FOREIGN KEY (poll_id, option_id)
        REFERENCES poll_options(poll_id, id)
        ON DELETE CASCADE,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX idx_poll_votes_poll_id
    ON poll_votes(poll_id);

    CREATE TABLE resources (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      room_id INTEGER NOT NULL,
      added_by INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      url TEXT,
      resource_type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

      FOREIGN KEY (added_by)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX idx_resources_room_id
    ON resources(room_id);

    CREATE TABLE resource_completions (
      resource_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (resource_id, user_id),

      FOREIGN KEY (resource_id)
        REFERENCES resources(id)
        ON DELETE CASCADE,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX idx_resource_completions_resource_id
    ON resource_completions(resource_id);

    CREATE TABLE study_sessions (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      room_id INTEGER NOT NULL,
      started_by INTEGER NOT NULL,
      started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP,

      FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

      FOREIGN KEY (started_by)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX idx_study_sessions_room_id
    ON study_sessions(room_id);

    CREATE TABLE activity_events (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX idx_activity_events_room_id
    ON activity_events(room_id);
  `);
}

export function down(pgm) {
  pgm.sql(`
    DROP TABLE activity_events;
    DROP TABLE study_sessions;
    DROP TABLE resource_completions;
    DROP TABLE resources;
    DROP TABLE poll_votes;
    DROP TABLE poll_options;
    DROP TABLE polls;
    DROP TABLE messages;
    DROP TABLE room_members;
    DROP TABLE rooms;
    DROP TABLE users;
  `);
}