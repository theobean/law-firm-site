-- Install as the dedicated schema owner after provisioning the two runtime roles.
-- Keep the anonymous daily totals for historical reports. The owner can prune
-- older day buckets if the reporting period changes.
CREATE TABLE site_traffic.daily_counts (
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
  hits bigint NOT NULL CHECK (hits > 0),
  PRIMARY KEY (day, locale, page)
);

CREATE FUNCTION site_traffic.record_request(p_day date, p_locale text, p_page text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $record$
  INSERT INTO site_traffic.daily_counts (day, locale, page, hits)
  VALUES (p_day, p_locale, p_page, 1)
  ON CONFLICT (day, locale, page)
  DO UPDATE SET hits = daily_counts.hits + 1
$record$;

REVOKE ALL ON SCHEMA site_traffic FROM PUBLIC;
REVOKE ALL ON TABLE site_traffic.daily_counts FROM PUBLIC;
REVOKE ALL ON FUNCTION site_traffic.record_request(date, text, text) FROM PUBLIC;

GRANT USAGE ON SCHEMA site_traffic TO site_traffic_writer, site_traffic_reader;
GRANT EXECUTE ON FUNCTION site_traffic.record_request(date, text, text) TO site_traffic_writer;
GRANT SELECT ON TABLE site_traffic.daily_counts TO site_traffic_reader;
