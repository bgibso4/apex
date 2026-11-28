CREATE TABLE program_run (
    id INTEGER PRIMARY KEY,
    program_id TEXT NOT NULL CHECK (program_id <> ''),
    started_on TEXT NOT NULL CHECK (started_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
) STRICT;
