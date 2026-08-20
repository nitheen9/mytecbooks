 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/functions/api/us-banks.js b/functions/api/us-banks.js
index 014f4ca7664206d8fdb5bff3ae86dd11b75ec4ab..2f3d4d2a42cace7b5e7bcd86f11e263ff5779502 100644
--- a/functions/api/us-banks.js
+++ b/functions/api/us-banks.js
@@ -617,112 +617,110 @@ async function getBranches(
 
 
     const requestedCity =
         normalizeCity(city);
 
 
     const certSearch =
         buildCertSearch(
             certs
         );
 
 
     const search =
         "(" +
         certSearch +
         ")" +
         " AND " +
         "STALP:" +
         escapeQuery(stateCode);
 
 
     const rows =
         await getAllLocations(
             search,
             [
-                "ID",
+                "UNINUM",
                 "NAME",
-                "OFFNAME",
                 "ADDRESS",
                 "CITY",
                 "STALP",
                 "ZIP",
                 "COUNTY",
                 "CERT",
                 "SERVTYPE"
             ].join(",")
         );
 
 
     const branches = [];
 
     const seen =
         new Set();
 
 
     for (
         const item of rows
     ) {
 
         if (
             normalizeCity(
                 item.CITY
             ) !== requestedCity
         ) {
 
             continue;
 
         }
 
 
         const id =
             String(
-                item.ID ?? ""
+                item.UNINUM ?? ""
             ).trim();
 
 
         if (
             !id ||
             seen.has(id)
         ) {
 
             continue;
 
         }
 
 
         seen.add(id);
 
 
         branches.push({
 
             id:
                 id,
 
             name:
                 String(
-                    item.OFFNAME ||
                     item.NAME ||
                     "Bank Branch"
                 ).trim(),
 
             address:
                 String(
                     item.ADDRESS ||
                     ""
                 ).trim(),
 
             city:
                 String(
                     item.CITY ||
                     ""
                 ).trim(),
 
             state:
                 String(
                     item.STALP ||
                     ""
                 ).trim(),
 
             zip:
                 String(
                     item.ZIP ||
@@ -779,51 +777,51 @@ async function getBranches(
 
     });
 
 }
 
 
 /* =========================================================
    GET ALL INSTITUTIONS
 ========================================================= */
 
 async function getAllInstitutions() {
 
     const allRows = [];
 
     const limit = 5000;
 
     let offset = 0;
 
 
     while (true) {
 
         const data =
             await fdicRequest(
                 "/institutions",
                 {
-                    search:
+                    filters:
                         "ACTIVE:1",
 
                     fields:
                         "NAME,CERT,CITY,STNAME,ACTIVE",
 
                     limit:
                         limit,
 
                     offset:
                         offset
                 }
             );
 
 
         const rows =
             extractRows(data);
 
 
         if (
             rows.length === 0
         ) {
 
             break;
 
         }
@@ -863,51 +861,51 @@ async function getAllInstitutions() {
 }
 
 
 /* =========================================================
    GET ALL LOCATIONS WITH PAGINATION
 ========================================================= */
 
 async function getAllLocations(
     search,
     fields
 ) {
 
     const allRows = [];
 
     const limit = 5000;
 
     let offset = 0;
 
 
     while (true) {
 
         const data =
             await fdicRequest(
                 "/locations",
                 {
-                    search:
+                    filters:
                         search,
 
                     fields:
                         fields,
 
                     limit:
                         limit,
 
                     offset:
                         offset
                 }
             );
 
 
         const rows =
             extractRows(data);
 
 
         if (
             rows.length === 0
         ) {
 
             break;
 
         }
 
EOF
)
