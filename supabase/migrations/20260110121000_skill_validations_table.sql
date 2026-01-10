-- Create skill_validations table
create table public.skill_validations (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    career_id text null,
    role text not null,
    domain text null,
    readiness_score integer not null default 0,
    matched_skills jsonb null default '{"strong": [], "partial": []}'::jsonb,
    missing_skills jsonb null default '[]'::jsonb,
    recommended_next_step text not null default 'learn'::text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    level text null default 'intermediate'::text,
    constraint skill_validations_pkey primary key (id),
    constraint skill_validations_recommended_next_step_check 
        check ((recommended_next_step = any (array[
            'learn'::text,
            'learn_foundation'::text,
            'project'::text,
            'job'::text
        ])))
) tablespace pg_default;

-- Create indexes for better query performance
create index if not exists idx_skill_validations_user_id 
    on public.skill_validations using btree (user_id) 
    tablespace pg_default;

create index if not exists idx_skill_validations_role 
    on public.skill_validations using btree (role) 
    tablespace pg_default;

-- Create composite index for user_id and role combination (common query pattern)
create index if not exists idx_skill_validations_user_role 
    on public.skill_validations using btree (user_id, role) 
    tablespace pg_default;

-- Create trigger to automatically update the updated_at column
create trigger update_skill_validations_updated_at 
    before update on skill_validations 
    for each row 
    execute function update_updated_at_column();

-- Add RLS (Row Level Security) policies
alter table public.skill_validations enable row level security;

-- Policy: Users can only see their own skill validations
create policy "Users can view their own skill validations" 
    on public.skill_validations 
    for select 
    using (auth.uid() = user_id);

-- Policy: Users can insert their own skill validations
create policy "Users can insert their own skill validations" 
    on public.skill_validations 
    for insert 
    with check (auth.uid() = user_id);

-- Policy: Users can update their own skill validations
create policy "Users can update their own skill validations" 
    on public.skill_validations 
    for update 
    using (auth.uid() = user_id);

-- Policy: Users can delete their own skill validations
create policy "Users can delete their own skill validations" 
    on public.skill_validations 
    for delete 
    using (auth.uid() = user_id);

-- Add comments for documentation
comment on table public.skill_validations is 'Stores skill validation results for users career roles';
comment on column public.skill_validations.readiness_score is 'Score from 0-100 indicating readiness for the role';
comment on column public.skill_validations.matched_skills is 'JSONB object with strong and partial skill matches';
comment on column public.skill_validations.missing_skills is 'JSONB array of skills that need to be learned';
comment on column public.skill_validations.recommended_next_step is 'Next recommended action: learn, learn_foundation, project, or job';
comment on column public.skill_validations.level is 'Experience level: beginner, intermediate, advanced, expert';