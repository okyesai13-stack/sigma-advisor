-- Create resume_career_advice table
create table public.resume_career_advice (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    resume_analysis_id uuid null,
    career_advice jsonb not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    selected_role text null,
    constraint resume_career_advice_pkey primary key (id),
    constraint resume_career_advice_resume_analysis_id_fkey foreign key (resume_analysis_id) 
        references resume_analysis (id) on delete cascade
) tablespace pg_default;

-- Create index for user_id for better query performance
create index if not exists idx_resume_career_advice_user_id 
    on public.resume_career_advice using btree (user_id) 
    tablespace pg_default;

-- Create trigger to automatically update the updated_at column
create trigger update_resume_career_advice_updated_at 
    before update on resume_career_advice 
    for each row 
    execute function update_updated_at_column();

-- Add RLS (Row Level Security) policies
alter table public.resume_career_advice enable row level security;

-- Policy: Users can only see their own career advice
create policy "Users can view their own career advice" 
    on public.resume_career_advice 
    for select 
    using (auth.uid() = user_id);

-- Policy: Users can insert their own career advice
create policy "Users can insert their own career advice" 
    on public.resume_career_advice 
    for insert 
    with check (auth.uid() = user_id);

-- Policy: Users can update their own career advice
create policy "Users can update their own career advice" 
    on public.resume_career_advice 
    for update 
    using (auth.uid() = user_id);

-- Policy: Users can delete their own career advice
create policy "Users can delete their own career advice" 
    on public.resume_career_advice 
    for delete 
    using (auth.uid() = user_id);