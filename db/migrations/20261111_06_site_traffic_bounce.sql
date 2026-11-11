-- Apply in a transaction as the dedicated traffic schema owner.
DO $owner$
BEGIN
  IF CURRENT_USER <> 'site_traffic_owner' THEN
    RAISE EXCEPTION 'site_traffic_owner_required';
  END IF;
END;
$owner$;

CREATE TABLE site_traffic.daily_bounce (
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
  entries bigint NOT NULL CHECK (entries > 0),
  continued bigint NOT NULL CHECK (continued BETWEEN 0 AND entries),
  PRIMARY KEY (day, locale, page)
);

CREATE FUNCTION site_traffic.record_bounce(p_day date, p_locale text, p_page text, p_continued boolean)
RETURNS void
LANGUAGE plpgsql
STRICT
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $record$
BEGIN
  IF p_continued THEN
    UPDATE site_traffic.daily_bounce
    SET continued = continued + 1
    WHERE day = p_day AND locale = p_locale AND page = p_page AND continued < entries;
  ELSE
    INSERT INTO site_traffic.daily_bounce (day, locale, page, entries, continued)
    VALUES (p_day, p_locale, p_page, 1, 0)
    ON CONFLICT (day, locale, page)
    DO UPDATE SET entries = daily_bounce.entries + 1;
  END IF;
END;
$record$;

REVOKE ALL ON TABLE site_traffic.daily_bounce FROM PUBLIC;
REVOKE ALL ON FUNCTION site_traffic.record_bounce(date, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION site_traffic.record_bounce(date, text, text, boolean) TO site_traffic_writer;
GRANT SELECT ON TABLE site_traffic.daily_bounce TO site_traffic_reader;
