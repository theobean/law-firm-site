-- Apply in a transaction as the dedicated traffic schema owner after the bounce migration.
DO $owner$
BEGIN
  IF CURRENT_USER <> 'site_traffic_owner' THEN
    RAISE EXCEPTION 'site_traffic_owner_required';
  END IF;
END;
$owner$;

CREATE TABLE site_traffic.daily_sources (
  day date NOT NULL CHECK (pg_catalog.isfinite(day)),
  locale text NOT NULL CHECK (locale IN ('el', 'en', 'de')),
  page text NOT NULL CHECK (
    pg_catalog.length(page) <= 400 AND (
      page = '/' OR (
        page ~ '^/(?:[a-zA-Z0-9_-]|%[0-9A-F]{2})+(?:/(?:[a-zA-Z0-9_-]|%[0-9A-F]{2})+)*$'
        AND pg_catalog.split_part(page, '/', 2) NOT IN ('el', 'en', 'de', 'api', 'studio', 'private')
      )
    )
  ),
  source text NOT NULL CHECK (source IN ('google', 'search', 'social', 'direct', 'referral', 'internal')),
  entries bigint NOT NULL CHECK (entries > 0),
  PRIMARY KEY (day, locale, page, source)
);

CREATE FUNCTION site_traffic.record_entry_source(p_day date, p_locale text, p_page text, p_source text)
RETURNS void
LANGUAGE sql
STRICT
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $record$
  SELECT site_traffic.record_bounce(p_day, p_locale, p_page, false);

  INSERT INTO site_traffic.daily_sources (day, locale, page, source, entries)
  VALUES (p_day, p_locale, p_page, p_source, 1)
  ON CONFLICT (day, locale, page, source)
  DO UPDATE SET entries = daily_sources.entries + 1;
$record$;

REVOKE ALL ON TABLE site_traffic.daily_sources FROM PUBLIC;
REVOKE ALL ON FUNCTION site_traffic.record_entry_source(date, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION site_traffic.record_entry_source(date, text, text, text) TO site_traffic_writer;
GRANT SELECT ON TABLE site_traffic.daily_sources TO site_traffic_reader;
