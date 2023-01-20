-- The command used to create table for this project 

CREATE TABLE envelope (
    id SERIAL PRIMARY KEY,
    title VARCHAR(25) NOT NULL UNIQUE,
    budget INTEGER NOT NULL CHECK (budget>=0) 
);

CREATE TABLE transaction (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50),
    from_envelope INTEGER REFERENCES envelope(id) NOT NULL,
    to_envelope INTEGER REFERENCES envelope(id) NULL,
    amount INTEGER CHECK (amount>=0) NOT NULL ,
    created_at TIMESTAMPTZ DEFAULT NOW() 
);

-- add unique contraints 
-- ALTER TABLE envelope
-- ADD UNIQUE (title);

-- add not null contraints 
-- ALTER TABLE transaction
-- ALTER COLUMN from_envelope SET NOT NULL;



