function get_gov_qs(latlng){

    if (latlng !== null){//add la search                       
                qs = 'SELECT array_to_json(array_agg(f)) as features ';
                qs +='     FROM (SELECT dep_dir_name, sector, auth.local_authority,';
                qs +='       row_to_json((SELECT l FROM ';
                qs +='       (SELECT sum(total_other_funding)/1000000 as "other", sum(total_welsh_government_funding)/1000000 as   "welsh_gov") ';
                qs +='     as l )) as spending ';
                qs +='        FROM wg_cap_schemes_postcode_geocoded wg ';	       
                qs +='         INNER JOIN ';
                qs +='         (SELECT  la as local_authority '; 
                qs +='         FROM localauthorities_hwm_region hwm, (SELECT ST_SetSRID(st_makepoint(';
                qs +=            latlng.lng + ',' + latlng.lat + '), 4326) as geom) g ';
                qs +='         WHERE  ST_Intersects(hwm.the_geom, g.geom)) auth ';
                qs +='         ON  wg.local_authority = auth.local_authority ';
                qs +='       GROUP BY  dep_dir_name, sector, auth.local_authority ';               
              }
     else{
                qs = 'SELECT array_to_json(array_agg(f)) as features ';
                qs +='     FROM (SELECT dep_dir_name, sector, \'Wales\' as local_authority,';
                qs +='       row_to_json((SELECT l FROM ';
                qs +='       (SELECT sum(total_other_funding)/1000000 as "other", sum(total_welsh_government_funding)/1000000 as   "welsh_gov") ';
                qs +='     as l )) as spending ';
                qs +='        FROM wg_cap_schemes_postcode_geocoded wg GROUP BY dep_dir_name, sector ';
              } //add order by  
              qs +='       ORDER BY (case when dep_dir_name = \'Education and Skills\' then 2 ';
              qs +='                 when dep_dir_name = \'Health and Social Services\' then 4';
              qs +='                 when dep_dir_name = \'Local Government and Communities\' then 5';
              qs +='                 when dep_dir_name = \'Economy, Science and Transport\' then 1 else 3 end ) ';
              qs +='   ) as f;';     

   return qs;

}
