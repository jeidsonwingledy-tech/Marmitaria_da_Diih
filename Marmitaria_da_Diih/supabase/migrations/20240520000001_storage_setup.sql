-- Create storage bucket for images
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Allow public access to the images bucket
-- Note: We use 'do' block to avoid errors if the policy already exists
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'objects' 
    and schemaname = 'storage' 
    and policyname = 'Public Access'
  ) then
    create policy "Public Access"
    on storage.objects for all
    using ( bucket_id = 'images' )
    with check ( bucket_id = 'images' );
  end if;
end $$;
