-- Apply in a transaction as the dedicated traffic schema owner.
DO $owner$
BEGIN
  IF CURRENT_USER <> 'site_traffic_owner' THEN
    RAISE EXCEPTION 'site_traffic_owner_required';
  END IF;
END;
$owner$;

ALTER TABLE site_traffic.daily_counts
  ADD COLUMN prefetch_requests bigint NOT NULL DEFAULT 0,
  ADD COLUMN suspected_bot_requests bigint NOT NULL DEFAULT 0,
  ADD CONSTRAINT daily_counts_request_kind_totals CHECK (
    suspected_bot_requests BETWEEN 0 AND hits
    AND prefetch_requests BETWEEN 0 AND hits - suspected_bot_requests
  );

-- Keep the three-argument writer for deployments that count only unclassified requests.
CREATE FUNCTION site_traffic.record_request(p_day date, p_locale text, p_page text, p_kind text)
RETURNS void
LANGUAGE plpgsql
STRICT
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $record$
BEGIN
  IF p_kind NOT IN ('prefetch', 'suspected_bot', 'unclassified') THEN
    RAISE EXCEPTION 'invalid_traffic_request_kind' USING ERRCODE = '22023';
  END IF;

  INSERT INTO site_traffic.daily_counts (
    day, locale, page, hits, prefetch_requests, suspected_bot_requests
  )
  VALUES (p_day, p_locale, p_page, 1, (p_kind = 'prefetch')::int, (p_kind = 'suspected_bot')::int)
  ON CONFLICT (day, locale, page)
  DO UPDATE SET hits = daily_counts.hits + EXCLUDED.hits,
                prefetch_requests = daily_counts.prefetch_requests + EXCLUDED.prefetch_requests,
                suspected_bot_requests = daily_counts.suspected_bot_requests + EXCLUDED.suspected_bot_requests;
END;
$record$;

REVOKE ALL ON FUNCTION site_traffic.record_request(date, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION site_traffic.record_request(date, text, text, text) TO site_traffic_writer;
