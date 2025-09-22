--Title of sql files should be--
--V<VERSION>__DESCRIPTION_HERE.sql--
--in order for flyway to properly recognize this as a migration--

--creating a table for users--
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255), --we can use something like Argon2 to hash and salt these--
    google_id VARCHAR(255) UNIQUE
);
--creating a table for user projects--
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    editor_ids INTEGER[],
    video_url TEXT, --this would hold links to user-uploaded videos that we handle and upload to cloud storage--
    clipping_timestamps JSONB,
    preferences JSONB,
    thumbnail_url TEXT, --this would hold links to user-uploaded videos that we handle and upload to cloud storage. can add a default path later--
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_opened TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--creating a table for annotations on a project's timeline--
CREATE TABLE annotations (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, --necessary because an editor can make annotations too--
    timestamp TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--creating a table to define labeled dance move segments--
CREATE TABLE dance_moves (
    dance_move_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    timestamp_start TIMESTAMPTZ NOT NULL,
    timestamp_end TIMESTAMPTZ NOT NULL
);

--faster lookup ayyyyy--
CREATE INDEX ON projects(owner_id);
CREATE INDEX ON annotations(project_id);
CREATE INDEX ON annotations(author_id);
CREATE INDEX ON dance_moves(project_id);