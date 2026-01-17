-- Insert default API token for VPS worker
INSERT OR IGNORE INTO api_tokens (token, name, is_active) 
VALUES ('dev-token-change-in-production', 'Development Token', 1);
