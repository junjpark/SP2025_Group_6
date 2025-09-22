--unestablish foreign key link between projects table and annotations table to users table--
ALTER TABLE projects DROP CONSTRAINT projects_owner_id_fkey;
ALTER TABLE annotations DROP CONSTRAINT annotations_author_id_fkey;

--rename users_id to id--
ALTER TABLE users RENAME COLUMN user_id TO id;

--rename ids to id in projects and annotations tables--
ALTER TABLE projects RENAME COLUMN owner_id TO user_id;
ALTER TABLE annotations RENAME COLUMN author_id TO user_id;

--re-link projects and annotations table to users table via new id column--
ALTER TABLE projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE annotations
    ADD CONSTRAINT annotations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

--unlink annotations and dance moves from projects--
ALTER TABLE annotations DROP CONSTRAINT annotations_project_id_fkey;
ALTER TABLE dance_moves DROP CONSTRAINT dance_moves_project_id_fkey;

--rename project_id to id--
ALTER TABLE projects RENAME COLUMN project_id TO id;

--re-link annotations and dance moves tables to projects--
ALTER TABLE annotations
    ADD CONSTRAINT annotations_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE dance_moves
    ADD CONSTRAINT dance_moves_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;


ALTER TABLE dance_moves RENAME COLUMN dance_move_id TO id;
