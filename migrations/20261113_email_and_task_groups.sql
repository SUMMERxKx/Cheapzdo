-- Apply in the Supabase SQL editor before deploying the app
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.work_items ADD COLUMN IF NOT EXISTS ping_on_assign BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.task_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
ALTER TABLE public.work_items ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES public.task_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_work_items_group_id ON public.work_items(group_id);
ALTER TABLE public.task_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on task_groups" ON public.task_groups;
CREATE POLICY "Allow all operations on task_groups" ON public.task_groups
  FOR ALL USING (true) WITH CHECK (true);
NOTIFY pgrst, 'reload schema';
