-- Adicionar novos tipos de arquivo: audio, voice, video_note, sticker
ALTER TABLE case_files
DROP CONSTRAINT IF EXISTS case_files_type_check;

ALTER TABLE case_files
ADD CONSTRAINT case_files_type_check
CHECK (file_type IN ('image', 'document', 'video', 'audio', 'voice', 'video_note', 'sticker'));
