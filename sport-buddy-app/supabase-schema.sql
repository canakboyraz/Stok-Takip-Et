-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create sports table
CREATE TABLE sports (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Insert default sports
INSERT INTO sports (name, icon) VALUES
    ('Tenis', 'tennis'),
    ('Futbol', 'soccer'),
    ('Basketbol', 'basketball'),
    ('Voleybol', 'volleyball'),
    ('Badminton', 'badminton'),
    ('Koşu', 'run'),
    ('Bisiklet', 'bike'),
    ('Yüzme', 'swim'),
    ('Masa Tenisi', 'table-tennis');

-- Create sport_sessions table
CREATE TABLE sport_sessions (
    id SERIAL PRIMARY KEY,
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    sport_id INTEGER REFERENCES sports(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    city TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_participants INTEGER DEFAULT 2 NOT NULL,
    skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'any')) DEFAULT 'any',
    status TEXT CHECK (status IN ('open', 'full', 'cancelled', 'completed')) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create session_participants table
CREATE TABLE session_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sport_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(session_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sport_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create ratings table
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sport_sessions(id) ON DELETE CASCADE NOT NULL,
    rated_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rater_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(session_id, rated_user_id, rater_user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_sport_sessions_creator ON sport_sessions(creator_id);
CREATE INDEX idx_sport_sessions_sport ON sport_sessions(sport_id);
CREATE INDEX idx_sport_sessions_date ON sport_sessions(session_date);
CREATE INDEX idx_sport_sessions_location ON sport_sessions(latitude, longitude);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_user ON session_participants(user_id);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX idx_ratings_session ON ratings(session_id);
CREATE INDEX idx_sport_sessions_city ON sport_sessions(city);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Sport sessions policies
CREATE POLICY "Anyone can view sport sessions"
    ON sport_sessions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create sport sessions"
    ON sport_sessions FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own sport sessions"
    ON sport_sessions FOR UPDATE
    USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own sport sessions"
    ON sport_sessions FOR DELETE
    USING (auth.uid() = creator_id);

-- Session participants policies
CREATE POLICY "Anyone can view session participants"
    ON session_participants FOR SELECT
    USING (true);

CREATE POLICY "Users can join sessions"
    ON session_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions"
    ON session_participants FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Session creators can update participant status"
    ON session_participants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sport_sessions
            WHERE sport_sessions.id = session_participants.session_id
            AND sport_sessions.creator_id = auth.uid()
        )
    );

-- Messages policies
CREATE POLICY "Participants can view session messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM session_participants
            WHERE session_participants.session_id = messages.session_id
            AND session_participants.user_id = auth.uid()
            AND session_participants.status = 'approved'
        )
        OR
        EXISTS (
            SELECT 1 FROM sport_sessions
            WHERE sport_sessions.id = messages.session_id
            AND sport_sessions.creator_id = auth.uid()
        )
    );

CREATE POLICY "Approved participants can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM session_participants
            WHERE session_participants.session_id = messages.session_id
            AND session_participants.user_id = auth.uid()
            AND session_participants.status = 'approved'
        )
        OR
        EXISTS (
            SELECT 1 FROM sport_sessions
            WHERE sport_sessions.id = messages.session_id
            AND sport_sessions.creator_id = auth.uid()
        )
    );

-- Ratings policies
CREATE POLICY "Anyone can view ratings"
    ON ratings FOR SELECT
    USING (true);

CREATE POLICY "Session participants can rate each other"
    ON ratings FOR INSERT
    WITH CHECK (
        auth.uid() = rater_user_id
        AND EXISTS (
            SELECT 1 FROM session_participants
            WHERE session_participants.session_id = ratings.session_id
            AND session_participants.user_id = auth.uid()
            AND session_participants.status = 'approved'
        )
        AND EXISTS (
            SELECT 1 FROM sport_sessions
            WHERE sport_sessions.id = ratings.session_id
            AND sport_sessions.status = 'completed'
        )
    );

-- Function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sport_sessions_updated_at BEFORE UPDATE ON sport_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_participants_updated_at BEFORE UPDATE ON session_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
