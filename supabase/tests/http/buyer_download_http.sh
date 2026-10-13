#!/bin/bash
# O-15 · HTTP-level check of the deployed buyer data-room function (exit-doc-buyer), for an operator whose
# machine can reach the project. It never prints a token or a signed link.
#
# Needs, by name only (never commit or echo the values):
#   SUPABASE_URL                project URL, e.g. https://<ref>.supabase.co
#   SUPABASE_PUBLISHABLE_KEY    the project's publishable (anon) key
#   BUYER_TOKEN                 access token of the NDA's buyer      (a controlled test account)
#   OTHER_TOKEN                 access token of an unrelated account (a controlled test account)
#   AGREEMENT_LIVE              executed NDA bound to a live transaction
#   AGREEMENT_TERMINATED        executed NDA whose transaction was terminated
#   AGREEMENT_EXPIRED           NDA past its access term
#   FILE_DISCLOSED FILE_SELLER_ONLY FILE_OTHER_COMPANY   data-room file ids for the NDA's seller
# The fixtures can be created with the SQL in docs/documents/HTTP_TEST_O15.md (and removed with cleanup_o15_fixtures.sql).
set -uo pipefail
F="$SUPABASE_URL/functions/v1/exit-doc-buyer"; fails=0
call() { # label expected-status method token [agreement] [file]
  local label=$1 want=$2 method=$3 tok=$4 ag=${5:-} file=${6:-} code body
  local auth=(); [ -n "$tok" ] && auth=(-H "Authorization: Bearer $tok")
  if [ "$method" = GET ]; then body=$(curl -s -w '\n%{http_code}' "${auth[@]}" -H "apikey: $SUPABASE_PUBLISHABLE_KEY" "$F?agreement=$ag")
  else body=$(curl -s -w '\n%{http_code}' -X POST "${auth[@]}" -H "apikey: $SUPABASE_PUBLISHABLE_KEY" -H 'content-type: application/json' -d "{\"agreement\":\"$ag\",\"file\":\"$file\"}" "$F"); fi
  code=${body##*$'\n'}; body=${body%$'\n'*}
  local leak=no; [ "$want" != 200 ] && echo "$body" | grep -q '"url"' && leak=yes
  if [ "$code" = "$want" ] && [ "$leak" = no ]; then echo "PASS $label ($code)"; else echo "FAIL $label (got $code, want $want, link in a denial: $leak)"; fails=$((fails+1)); fi
  LAST_BODY=$body
}
call "buyer lists under the live transaction" 200 GET "$BUYER_TOKEN" "$AGREEMENT_LIVE"
call "buyer downloads the disclosed file" 200 POST "$BUYER_TOKEN" "$AGREEMENT_LIVE" "$FILE_DISCLOSED"
URL=$(echo "$LAST_BODY" | sed -n 's/.*"url":"\([^"]*\)".*/\1/p')
call "seller-only file" 403 POST "$BUYER_TOKEN" "$AGREEMENT_LIVE" "$FILE_SELLER_ONLY"
call "another company's file" 403 POST "$BUYER_TOKEN" "$AGREEMENT_LIVE" "$FILE_OTHER_COMPANY"
call "wrong buyer" 403 GET "$OTHER_TOKEN" "$AGREEMENT_LIVE"
call "terminated transaction" 403 POST "$BUYER_TOKEN" "$AGREEMENT_TERMINATED" "$FILE_DISCLOSED"
call "expired NDA" 403 POST "$BUYER_TOKEN" "$AGREEMENT_EXPIRED" "$FILE_DISCLOSED"
call "no token" 401 GET "" "$AGREEMENT_LIVE"
link() { curl -s -o /dev/null -w '%{http_code}' "$1"; }
[ "$(link "$URL")" = 200 ] && echo "PASS signed link opens" || { echo "FAIL signed link"; fails=$((fails+1)); }
[ "$(link "${URL/token=/token=x}")" = 400 ] && echo "PASS tampered link refused" || { echo "FAIL tampered link"; fails=$((fails+1)); }
sleep 65; [ "$(link "$URL")" = 400 ] && echo "PASS link refused after 60 s" || { echo "FAIL expiry"; fails=$((fails+1)); }
echo "$fails failed"; exit $((fails > 0))
