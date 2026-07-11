drop table if exists rag_chunks cascade;
create extension if not exists vector;
create table rag_chunks (
id text primary key,
doc_id text not null,
doc_title text not null,
source text not null,
category text,
section text,
page int,
content text not null,
tokens int,
embedding vector(768),
created_at timestamptz default now()
);
create index rag_chunks_doc_id_idx on rag_chunks (doc_id);
create index rag_chunks_embedding_idx on rag_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create or replace function match_chunks(query_embedding vector(768), match_count int)
returns table (id text, doc_id text, doc_title text, source text, category text, section text, page int, content text, tokens int, score float)
language sql stable as $$
select rag_chunks.id, rag_chunks.doc_id, rag_chunks.doc_title, rag_chunks.source, rag_chunks.category, rag_chunks.section, rag_chunks.page, rag_chunks.content, rag_chunks.tokens, 1 - (rag_chunks.embedding <=> query_embedding) as score
from rag_chunks
where rag_chunks.embedding is not null
order by rag_chunks.embedding <=> query_embedding
limit match_count;
$$;
notify pgrst, 'reload schema';
