/*
Copyright (c) 2011 BitTorrent, Inc. All rights reserved.

Use of this source code is governed by a BSD-style that can be
found in the LICENSE file.
*/

var LANG_STR =
{
   "CT_MASK1":"Torrent filer||*.torrent||Alle filer (*.*)||*.*||",
   "DLG_BTN_OK":"OK",
   "DLG_BTN_CANCEL":"Avbryt",
   "DLG_BTN_APPLY":"Bruk",
   "DLG_BTN_YES":"Yes",
   "DLG_BTN_NO":"No",
   "DLG_BTN_CLOSE":"Lat att",
   "DLG_SETTINGS_00":"Innstillingar",
   "DLG_SETTINGS_1_GENERAL_01":"Språk",
   "DLG_SETTINGS_1_GENERAL_02":"språk:",
   "DLG_SETTINGS_1_GENERAL_10":"Personvern",
   "DLG_SETTINGS_1_GENERAL_11":"Sjå etter oppdateringar automatisk",
   "DLG_SETTINGS_1_GENERAL_12":"Oppdater til betaversjonar",
   "DLG_SETTINGS_1_GENERAL_13":"Send anonym informasjon når ein ser etter oppdateringar",
   "DLG_SETTINGS_1_GENERAL_17":"Ved nedlasting",
   "DLG_SETTINGS_1_GENERAL_18":"legg til.!ut til ufullstendige filer",
   "DLG_SETTINGS_1_GENERAL_19":"Førehandstildel alle filer",
   "DLG_SETTINGS_1_GENERAL_20":"Hindre ventemodus ved aktive torrentar",
   "DLG_SETTINGS_2_UI_01":"Vis val",
   "DLG_SETTINGS_2_UI_02":"Stadfest sletting av torentar",
   "DLG_SETTINGS_2_UI_03":"Stadfest sletting av sporfølgjar",
   "DLG_SETTINGS_2_UI_04":"Vis stadfestingsmelding ved avslutting",
   "DLG_SETTINGS_2_UI_05":"Alternate farge for listebakgrunn",
   "DLG_SETTINGS_2_UI_06":"Vis gjeldande fart i tittellinja",
   "DLG_SETTINGS_2_UI_07":"Vis fartsgrense i statusfeltet",
   "DLG_SETTINGS_2_UI_15":"Når torrentar vert lagt til",
   "DLG_SETTINGS_2_UI_16":"Ikkje start nedlastinga automatisk",
   "DLG_SETTINGS_2_UI_17":"Aktiver programvindauge",
   "DLG_SETTINGS_2_UI_18":"Opne eit vindauge som viser filene i torrenten",
   "DLG_SETTINGS_2_UI_19":"Handlingar ved dobbelklikk",
   "DLG_SETTINGS_2_UI_20":"Ved kjeldedeling av torrentar",
   "DLG_SETTINGS_2_UI_22":"Ved nedlasting av torrentar:",
   "DLG_SETTINGS_3_PATHS_01":"Plassering til nedlasta filer",
   "DLG_SETTINGS_3_PATHS_02":"Legg nye nedlastingar i:",
   "DLG_SETTINGS_3_PATHS_03":"Alltid vis dialog ved manuell tillegging",
   "DLG_SETTINGS_3_PATHS_06":"Flytt ferdige nedlastingar til:",
   "DLG_SETTINGS_3_PATHS_07":"Legg til torrentens merkelapp",
   "DLG_SETTINGS_3_PATHS_10":"Berre flytt frå standard nedlastingsmappe",
   "DLG_SETTINGS_3_PATHS_11":"Plassering av torrentar",
   "DLG_SETTINGS_3_PATHS_12":"Lagre .torrentar i:",
   "DLG_SETTINGS_3_PATHS_15":"Flytt .torrentar med avslutta jobbar til:",
   "DLG_SETTINGS_3_PATHS_18":"Automatisk last .torrentar frå",
   "DLG_SETTINGS_3_PATHS_19":"Slett lasta .torrentar",
   "DLG_SETTINGS_4_CONN_01":"Lytteport",
   "DLG_SETTINGS_4_CONN_02":"Port brukt for innkomande samband:",
   "DLG_SETTINGS_4_CONN_04":"Tilfeldig port",
   "DLG_SETTINGS_4_CONN_05":"Tilfeldiggjer port ved kvar oppstart",
   "DLG_SETTINGS_4_CONN_06":"Slå på UPnP port-mapping",
   "DLG_SETTINGS_4_CONN_07":"Slå på NAT-PMP port-mapping",
   "DLG_SETTINGS_4_CONN_08":"Mellomtenar",
   "DLG_SETTINGS_4_CONN_09":"Type:",
   "DLG_SETTINGS_4_CONN_11":"Mellomt:",
   "DLG_SETTINGS_4_CONN_13":"Port:",
   "DLG_SETTINGS_4_CONN_15":"Stadfesting",
   "DLG_SETTINGS_4_CONN_16":"Brukarnamn:",
   "DLG_SETTINGS_4_CONN_18":"Passord:",
   "DLG_SETTINGS_4_CONN_19":"Oppløys vertsnamn gjennom mellomtenar",
   "DLG_SETTINGS_4_CONN_20":"Bruk mellomtenar for klient-til-klient-samband",
   "DLG_SETTINGS_4_CONN_21":"Legg til Windows brannmur-unnatak",
   "DLG_SETTINGS_4_CONN_22":"Proxy Privacy",
   "DLG_SETTINGS_4_CONN_23":"Disable all local DNS lookups",
   "DLG_SETTINGS_4_CONN_24":"Disable all features that leak identifying information",
   "DLG_SETTINGS_4_CONN_25":"Disable connections unsupported by the proxy",
   "DLG_SETTINGS_5_BANDWIDTH_01":"Global avgrensing av opp-fart",
   "DLG_SETTINGS_5_BANDWIDTH_02":"Maks opp-fart (kB/s): [0: uavgrensa]",
   "DLG_SETTINGS_5_BANDWIDTH_03":"Automatisk",
   "DLG_SETTINGS_5_BANDWIDTH_05":"Veksle opp-fart når det ikkje er nedlastingar (kB/s):",
   "DLG_SETTINGS_5_BANDWIDTH_07":"Global avgrensing av ned-fart",
   "DLG_SETTINGS_5_BANDWIDTH_08":"Maks ned-fart (kB/s): [0: uavgrensa]",
   "DLG_SETTINGS_5_BANDWIDTH_10":"Tal på tilkoplingar",
   "DLG_SETTINGS_5_BANDWIDTH_11":"Globalt maks tal på tilkoplingar",
   "DLG_SETTINGS_5_BANDWIDTH_14":"Maks tal på tilkopla klientar pr. torrent:",
   "DLG_SETTINGS_5_BANDWIDTH_15":"Talet på opplastingsplassar pr. torrent:",
   "DLG_SETTINGS_5_BANDWIDTH_17":"Bruk ekstra opplastingsplassar om opp-fart er < 90%",
   "DLG_SETTINGS_5_BANDWIDTH_18":"Global Rate Limit Options",
   "DLG_SETTINGS_5_BANDWIDTH_19":"Apply rate limit to transport overhead",
   "DLG_SETTINGS_5_BANDWIDTH_20":"Apply rate limit to uTP connections",
   "DLG_SETTINGS_6_BITTORRENT_01":"Grunnleggjande BitTorren-funksjonar",
   "DLG_SETTINGS_6_BITTORRENT_02":"Slå på DHT-nettverk",
   "DLG_SETTINGS_6_BITTORRENT_03":"Spør sporfølgjar om skrape-info",
   "DLG_SETTINGS_6_BITTORRENT_04":"Slå på DHT for nye torrentar",
   "DLG_SETTINGS_6_BITTORRENT_05":"Slå på klientutveksling",
   "DLG_SETTINGS_6_BITTORRENT_06":"Slå på Lokal klientoppdaging",
   "DLG_SETTINGS_6_BITTORRENT_07":"Avgrens lokal klientbandbreidde",
   "DLG_SETTINGS_6_BITTORRENT_08":"IP/Vertsnamn rapporterer til sporfølgjar",
   "DLG_SETTINGS_6_BITTORRENT_10":"Protokollkryptering",
   "DLG_SETTINGS_6_BITTORRENT_11":"Utgåande:",
   "DLG_SETTINGS_6_BITTORRENT_13":"Tillat innkomande eldre tilkoplingar",
   "DLG_SETTINGS_6_BITTORRENT_14":"Enable bandwidth management [uTP]",
   "DLG_SETTINGS_6_BITTORRENT_15":"Enable UDP tracker support",
   "DLG_SETTINGS_7_TRANSFERCAP_01":"Slå på overføringslås",
   "DLG_SETTINGS_7_TRANSFERCAP_02":"Låseinnstillingar",
   "DLG_SETTINGS_7_TRANSFERCAP_03":"Limit Type:",
   "DLG_SETTINGS_7_TRANSFERCAP_04":"Bandwidth Cap:",
   "DLG_SETTINGS_7_TRANSFERCAP_05":"Time Period (days):",
   "DLG_SETTINGS_7_TRANSFERCAP_06":"Brukshistorikk for vald periode:",
   "DLG_SETTINGS_7_TRANSFERCAP_07":"Opplasta:",
   "DLG_SETTINGS_7_TRANSFERCAP_08":"Nedlasta:",
   "DLG_SETTINGS_7_TRANSFERCAP_09":"Opplasta + nedlasta:",
   "DLG_SETTINGS_7_TRANSFERCAP_10":"Tidsperiode:",
   "DLG_SETTINGS_7_TRANSFERCAP_11":"Siste %d dagar",
   "DLG_SETTINGS_7_TRANSFERCAP_12":"Nullstill historikk",
   "DLG_SETTINGS_8_QUEUEING_01":"Køinstillingar",
   "DLG_SETTINGS_8_QUEUEING_02":"Høgste tal på aktive torrentar (opp- og nedlasting)",
   "DLG_SETTINGS_8_QUEUEING_04":"Høgste tal på aktive nedlastingar:",
   "DLG_SETTINGS_8_QUEUEING_06":"Kjeldedel når [standardverdiar]",
   "DLG_SETTINGS_8_QUEUEING_07":"Minimum ratio (%):",
   "DLG_SETTINGS_8_QUEUEING_09":"Minimum seeding time (minutes):",
   "DLG_SETTINGS_8_QUEUEING_11":"Kjeldedelingsoppgåver har høgare prioritet enn nedlastingsoppgåver",
   "DLG_SETTINGS_8_QUEUEING_12":"Når µTorrent når kjeldedelingsmålet",
   "DLG_SETTINGS_8_QUEUEING_13":"Avgrens opplastingsfart til (kB/s): [0: stopp]",
   "DLG_SETTINGS_9_SCHEDULER_01":"Slå på planleggjar",
   "DLG_SETTINGS_9_SCHEDULER_02":"Planleggjarliste",
   "DLG_SETTINGS_9_SCHEDULER_04":"Innstillingar for planleggjar",
   "DLG_SETTINGS_9_SCHEDULER_05":"Avgrensa opplastingsfart (kb/s):",
   "DLG_SETTINGS_9_SCHEDULER_07":"Avgrensa nedlastingsfart (kb/s):",
   "DLG_SETTINGS_9_SCHEDULER_09":"Slå av DHT ved avslåing",
   "DLG_SETTINGS_9_WEBUI_01":"Slå på Vev-UI",
   "DLG_SETTINGS_9_WEBUI_02":"Stadfesting",
   "DLG_SETTINGS_9_WEBUI_03":"Brukarnamn:",
   "DLG_SETTINGS_9_WEBUI_05":"Passord:",
   "DLG_SETTINGS_9_WEBUI_07":"Slå på gjestekonto med brukarnamn",
   "DLG_SETTINGS_9_WEBUI_09":"Sambandsaktivitet",
   "DLG_SETTINGS_9_WEBUI_10":"Alternativ lytteport (standard er tilkoplingsport):",
   "DLG_SETTINGS_9_WEBUI_12":"Avgrens tilgang til følgjande IP-ar (skil fleire oppføringar med komma):",
   "DLG_SETTINGS_A_ADVANCED_01":"Avanserte innstillingar [ÅTVARING: ikkje modifiser!]",
   "DLG_SETTINGS_A_ADVANCED_02":"verdi:",
   "DLG_SETTINGS_A_ADVANCED_03":"rett",
   "DLG_SETTINGS_A_ADVANCED_04":"gale",
   "DLG_SETTINGS_A_ADVANCED_05":"vel",
   "DLG_SETTINGS_B_ADV_UI_01":"Sprettoppliste for fart [skil ulike verdiar med komma]",
   "DLG_SETTINGS_B_ADV_UI_02":"Overstyr automatisk sprettoppliste for fart",
   "DLG_SETTINGS_B_ADV_UI_03":"Last opp fartsliste:",
   "DLG_SETTINGS_B_ADV_UI_05":"Last ned fartsliste:",
   "DLG_SETTINGS_B_ADV_UI_07":"Varige merkelappar [Skil fleire merkelappar med teiknet | ]",
   "DLG_SETTINGS_B_ADV_UI_08":"Søkjemotorar [Format: namn|URL]",
   "DLG_SETTINGS_C_ADV_CACHE_01":"Enkle snøgglager-innstillingar",
   "DLG_SETTINGS_C_ADV_CACHE_02":"Platesnøgglageret vert brukt til å ha ofte brukte data i minnet for å redusere talet på lesingar og skrivingar til harddisken. µTorrent greier vanlegvis snøgglagringa automatisk, men du kan og stille det inn manuelt.",
   "DLG_SETTINGS_C_ADV_CACHE_03":"Still inn storleiken på snøgglageret manuelt (MB):",
   "DLG_SETTINGS_C_ADV_CACHE_05":"Mink minnebruken når snøgglageret ikkje er i bruk",
   "DLG_SETTINGS_C_ADV_CACHE_06":"Avanserte snøgglager-innstillingar",
   "DLG_SETTINGS_C_ADV_CACHE_07":"Slå på snøgglagring for plate skriving",
   "DLG_SETTINGS_C_ADV_CACHE_08":"Skriv ut urørte blokker kvart 2. minutt",
   "DLG_SETTINGS_C_ADV_CACHE_09":"Skriv ut ferdige blokker med ein gong",
   "DLG_SETTINGS_C_ADV_CACHE_10":"Slå på snøgglagring for plate lesing",
   "DLG_SETTINGS_C_ADV_CACHE_11":"Slå av les snøgglagring om opp-fart er låg",
   "DLG_SETTINGS_C_ADV_CACHE_12":"Fjern gamle blokker frå snøgglageret",
   "DLG_SETTINGS_C_ADV_CACHE_13":"Auk automatisk snøgglagerstorleik ved sletting av snøgglager",
   "DLG_SETTINGS_C_ADV_CACHE_14":"Slå av Windows-snøgglagring ved skriving til plate",
   "DLG_SETTINGS_C_ADV_CACHE_15":"Slå av Windows-snøgglagring ved lesing av plate",
   "DLG_SETTINGS_C_ADV_RUN_01":"Run Program",
   "DLG_SETTINGS_C_ADV_RUN_02":"Run this program when a torrent finishes:",
   "DLG_SETTINGS_C_ADV_RUN_04":"Run this program when a torrent changes state:",
   "DLG_SETTINGS_C_ADV_RUN_06":"You can use these commands:\r\n%F - Name of downloaded file (for single file torrents)\r\n%D - Directory where files are saved\r\n%N - Title of torrent\r\n%S - State of torrent\r\n%L - Label\r\n%T - Tracker\r\n%M - Status message string (same as status column)\r\n%I - hex encoded info-hash\r\n\r\nState is a combination of:\r\nstarted = 1, checking = 2, start-after-check = 4,\r\nchecked = 8, error = 16, paused = 32, auto = 64, loaded = 128",
   "DLG_TORRENTPROP_00":"Torrent-eigenskapar",
   "DLG_TORRENTPROP_1_GEN_01":"Sporfølgjarar (skil rader med ei tom linje)",
   "DLG_TORRENTPROP_1_GEN_03":"Bandbreiddeinnstillngar",
   "DLG_TORRENTPROP_1_GEN_04":"Maks. opplastingsfart (kB/s): [0: standard]",
   "DLG_TORRENTPROP_1_GEN_06":"Maks nedlastingsfart (kB/s): [0: standard]",
   "DLG_TORRENTPROP_1_GEN_08":"Tal på opplastingsplassar: [0: default]",
   "DLG_TORRENTPROP_1_GEN_10":"Kjeldedel når",
   "DLG_TORRENTPROP_1_GEN_11":"Overkøyr standardinnstillingar",
   "DLG_TORRENTPROP_1_GEN_12":"Minimum ratio (%):",
   "DLG_TORRENTPROP_1_GEN_14":"Minimum seeding time (minutes):",
   "DLG_TORRENTPROP_1_GEN_16":"Andre innstillingar",
   "DLG_TORRENTPROP_1_GEN_17":"Første kjeldedeling",
   "DLG_TORRENTPROP_1_GEN_18":"Slå på DHT",
   "DLG_TORRENTPROP_1_GEN_19":"Klientutveksling",
   "DLG_ADDEDITRSSFEED_03":"Kjelde",
   "DLG_ADDEDITRSSFEED_04":"Kjelde-URL:",
   "DLG_ADDEDITRSSFEED_05":"Standard-alias:",
   "DLG_ADDEDITRSSFEED_06":"Tinging",
   "DLG_ADDEDITRSSFEED_07":"Ikkje last ned alle elementa automatisk",
   "DLG_ADDEDITRSSFEED_08":"Automatisk last ned alle element publisert i kjelde",
   "DLG_ADDEDITRSSFEED_09":"Bruk smart episodefilter",
   "DLG_RSSDOWNLOADER_02":"Feeds||Favorittar||Historikk||",
   "DLG_RSSDOWNLOADER_03":"Alle kjelder",
   "DLG_RSSDOWNLOADER_04":"Filterinnstillingar",
   "DLG_RSSDOWNLOADER_05":"Namn:",
   "DLG_RSSDOWNLOADER_06":"Filter:",
   "DLG_RSSDOWNLOADER_07":"Ikkje:",
   "DLG_RSSDOWNLOADER_08":"Lagre i:",
   "DLG_RSSDOWNLOADER_09":"Kjelde:",
   "DLG_RSSDOWNLOADER_10":"Kvalitet:",
   "DLG_RSSDOWNLOADER_11":"Episodenummer: [døme: 1x12-14]",
   "DLG_RSSDOWNLOADER_12":"Filter matchar original-namn i staden for dekoda namn",
   "DLG_RSSDOWNLOADER_13":"Ikkje start nedlastingar automatisk",
   "DLG_RSSDOWNLOADER_14":"Smart ep. filter",
   "DLG_RSSDOWNLOADER_15":"Gje høgste prioritet til nedlasting",
   "DLG_RSSDOWNLOADER_16":"Minimum intervall:",
   "DLG_RSSDOWNLOADER_17":"Merkelapp for nye torr.:",
   "DLG_RSSDOWNLOADER_18":"Legg til RSS-kjelde …",
   "DLG_RSSDOWNLOADER_19":"Rediger kjelde …",
   "DLG_RSSDOWNLOADER_20":"Slå av kjelde",
   "DLG_RSSDOWNLOADER_21":"Slå på kjelde",
   "DLG_RSSDOWNLOADER_22":"Oppdater kjelde",
   "DLG_RSSDOWNLOADER_23":"Slett kjelde",
   "DLG_RSSDOWNLOADER_24":"last ned",
   "DLG_RSSDOWNLOADER_25":"Opne URL i nettlesar",
   "DLG_RSSDOWNLOADER_26":"legg til i favorittar",
   "DLG_RSSDOWNLOADER_27":"Legg til",
   "DLG_RSSDOWNLOADER_28":"Slett",
   "DLG_RSSDOWNLOADER_29":"ALLE",
   "DLG_RSSDOWNLOADER_30":"(Alle)",
   "DLG_RSSDOWNLOADER_31":"(matche alltid)||(matche ein gong)||12 timar||1 dag||2 dagar||3 dagar||4 dagar||1 veke||2 veker||3 veker||1 månad||",
   "DLG_RSSDOWNLOADER_32":"Legg til RSS",
   "DLG_RSSDOWNLOADER_33":"Rediger RSS-kjelde",
   "DLG_RSSDOWNLOADER_34":"Remove RSS Feed(s)",
   "DLG_RSSDOWNLOADER_35":"Really delete the %d selected RSS Feeds?",
   "DLG_RSSDOWNLOADER_36":"Slette RSS-nyhendekjelde \"%s\"?",
   "FEED_COL_FULLNAME":"Fullt namn",
   "FEED_COL_NAME":"Namn",
   "FEED_COL_EPISODE":"Episode",
   "FEED_COL_FORMAT":"Format",
   "FEED_COL_CODEC":"Kodek",
   "FEED_COL_DATE":"Date",
   "FEED_COL_FEED":"Nyhendekjelde",
   "FEED_COL_URL":"URL",
   "PRS_COL_IP":"Ip",
   "PRS_COL_PORT":"Port",
   "PRS_COL_CLIENT":"Klient",
   "PRS_COL_FLAGS":"Flagg",
   "PRS_COL_PCNT":"%",
   "PRS_COL_RELEVANCE":"Relevans",
   "PRS_COL_DOWNSPEED":"Ned-fart",
   "PRS_COL_UPSPEED":"Opp-fart",
   "PRS_COL_REQS":"Etterspurnader",
   "PRS_COL_WAITED":"Venta",
   "PRS_COL_UPLOADED":"Opplasta",
   "PRS_COL_DOWNLOADED":"Nedlasta",
   "PRS_COL_HASHERR":"Hasherr",
   "PRS_COL_PEERDL":"Klient dl.",
   "PRS_COL_MAXUP":"MaksOpp",
   "PRS_COL_MAXDOWN":"MaksNed",
   "PRS_COL_QUEUED":"Sett i kø",
   "PRS_COL_INACTIVE":"Ikkje aktiv",
   "FI_COL_DONE":"Ferdig",
   "FI_COL_FIRSTPC":"Første del",
   "FI_COL_NAME":"Namn",
   "FI_COL_NUMPCS":"# Delar",
   "FI_COL_PCNT":"%",
   "FI_COL_PRIO":"Prioritet",
   "FI_COL_SIZE":"Storleik",
   "FI_PRI0":"hopp over",
   "FI_PRI1":"låg",
   "FI_PRI2":"normal",
   "FI_PRI3":"høg",
   "GN_TP_01":"Nedlasta:",
   "GN_TP_02":"Opplasta:",
   "GN_TP_03":"Kjelder:",
   "GN_TP_04":"Står att:",
   "GN_TP_05":"Nedlastingsfart:",
   "GN_TP_06":"Opplastingsfart:",
   "GN_TP_07":"Klientar:",
   "GN_TP_08":"Delingstilhøve:",
   "GN_TP_09":"Lagre som:",
   "GN_TP_10":"Hash:",
   "GN_GENERAL":"Generelt",
   "GN_TRANSFER":"Overføring",
   "GN_XCONN":"%d av %d påkopla (%d i sverm)",
   "MAIN_TITLEBAR_SPEED":"D:%s U:%s - %s",
   "MENU_COPY":"Kopier",
   "MENU_RESET":"Nullstill",
   "MENU_UNLIMITED":"Uavgrensa",
   "MP_RESOLVE_IPS":"Oppløys IP-ar",
   "MF_GETFILE":"Get File(s)",
   "MF_DONT":"Ikkje last ned",
   "MF_HIGH":"Høg prioritet",
   "MF_LOW":"Låg prioritet",
   "MF_NORMAL":"Normal prioritet",
   "ML_COPY_MAGNETURI":"Kopier magnet-URI",
   "ML_DELETE_DATA":"Slett data",
   "ML_DELETE_TORRENT":"Slett .torrent",
   "ML_DELETE_DATATORRENT":"Slett .torrent + data",
   "ML_FORCE_RECHECK":"Tving re-sjekk",
   "ML_FORCE_START":"Tving start",
   "ML_LABEL":"Merkelapp",
   "ML_PAUSE":"Pause",
   "ML_PROPERTIES":"Eigenskapar",
   "ML_QUEUEDOWN":"Flytt ned i køen",
   "ML_QUEUEUP":"Flytt opp i køen",
   "ML_REMOVE":"Fjern",
   "ML_REMOVE_AND":"Fjern og",
   "ML_START":"Start",
   "ML_STOP":"Stopp",
   "OV_CAT_ACTIVE":"Aktiv",
   "OV_CAT_ALL":"Alle",
   "OV_CAT_COMPL":"Ferdig",
   "OV_CAT_DL":"Lastar ned",
   "OV_CAT_INACTIVE":"Ikkje aktiv",
   "OV_CAT_NOLABEL":"Ingen merkelapp",
   "OV_COL_AVAIL":"||Tilgj.||Tilgjengelegheit",
   "OV_COL_DATE_ADDED":"Lagt til den",
   "OV_COL_DATE_COMPLETED":"Fullført den",
   "OV_COL_DONE":"Ferdig",
   "OV_COL_DOWNLOADED":"Nedlasta",
   "OV_COL_DOWNSPD":"Ned-fart",
   "OV_COL_ETA":"ETA",
   "OV_COL_LABEL":"Merkelapp",
   "OV_COL_NAME":"Namn",
   "OV_COL_ORDER":"#",
   "OV_COL_PEERS":"Klientar",
   "OV_COL_REMAINING":"Står att",
   "OV_COL_SEEDS":"Kjelder",
   "OV_COL_SEEDS_PEERS":"Kjeldedelarar/Klientar",
   "OV_COL_SHARED":"Tilhøve",
   "OV_COL_SIZE":"Storleik",
   "OV_COL_SOURCE_URL":"Kjelde-URL",
   "OV_COL_STATUS":"Status",
   "OV_COL_UPPED":"Opplasta",
   "OV_COL_UPSPD":"Opp-fart",
   "OV_CONFIRM_DELETEDATA_MULTIPLE":"Vil du fjerne dei %d valde torrentane og tilhøyrande data?",
   "OV_CONFIRM_DELETEDATA_ONE":"Vil du fjerne den valde torrenten og tilhøyrande data?",
   "OV_CONFIRM_DELETE_MULTIPLE":"Vil du fjerne dei %d valde torrentane?",
   "OV_CONFIRM_DELETE_ONE":"Vil du fjerne vald torrent?",
   "OV_CONFIRM_DELETE_RSSFILTER":"Slette RSS-filter \"%s\"?",
   "OV_FL_CHECKED":"Sjekka %:.1d%",
   "OV_FL_DOWNLOADING":"Lastar ned",
   "OV_FL_ERROR":"Feil: %s",
   "OV_FL_FINISHED":"Ferdig",
   "OV_FL_PAUSED":"Sett i pause",
   "OV_FL_QUEUED":"Sett i kø",
   "OV_FL_QUEUED_SEED":"Kjelde sett i kø",
   "OV_FL_SEEDING":"Kjeldedeler",
   "OV_FL_STOPPED":"Stoppa",
   "OV_NEWLABEL_CAPTION":"Skriv inn namn på merkelapp",
   "OV_NEWLABEL_TEXT":"Skriv inn ny merkelapp for valde torrentar:",
   "OV_NEW_LABEL":"Ny merkelapp …",
   "OV_REMOVE_LABEL":"Fjern merkelapp",
   "OV_TABS":"Generelt||Sporfølgjarar||Klientar||Delar||Filer||Fart||Logg||",
   "OV_TB_ADDTORR":"Legg til torrent",
   "OV_TB_ADDURL":"Legg til torrent frå URL",
   "OV_TB_PAUSE":"Pause",
   "OV_TB_PREF":"Innstillingar",
   "OV_TB_QUEUEDOWN":"Flytt ned i køen",
   "OV_TB_QUEUEUP":"Flytt opp i køen",
   "OV_TB_REMOVE":"Fjern",
   "OV_TB_RSSDOWNLDR":"RSS-nedlastar",
   "OV_TB_START":"Start",
   "OV_TB_STOP":"Stopp",
   "MM_FILE":"Fil",
   "MM_FILE_ADD_TORRENT":"Legg til torrent …",
   "MM_FILE_ADD_URL":"Legg til torrent frå URL …",
   "MM_OPTIONS":"Innstillingar",
   "MM_OPTIONS_PREFERENCES":"Innstillingar",
   "MM_OPTIONS_SHOW_CATEGORY":"Vis kategoriliste",
   "MM_OPTIONS_SHOW_DETAIL":"Vis detaljert info",
   "MM_OPTIONS_SHOW_STATUS":"Vis statuslinje",
   "MM_OPTIONS_SHOW_TOOLBAR":"Vis verktøylinje",
   "MM_OPTIONS_TAB_ICONS":"Ikon på faner",
   "MM_HELP":"Hjelp",
   "MM_HELP_UT_WEBPAGE":"µTorrent-nettside",
   "MM_HELP_UT_FORUMS":"µTorrent-forum",
   "MM_HELP_WEBUI_FEEDBACK":"Send WebUI Feedback",
   "MM_HELP_ABOUT_WEBUI":"About µTorrent WebUI",
   "STM_TORRENTS":"Torrents",
   "STM_TORRENTS_PAUSEALL":"Alle torrentar i pause",
   "STM_TORRENTS_RESUMEALL":"Fullfør alle torrentar",
   "SB_DOWNLOAD":"D: %s%z/s",
   "SB_LOCAL":" L: %z/s",
   "SB_OVERHEAD":" O: %z/s",
   "SB_TOTAL":" T: %Z",
   "SB_UPLOAD":"U: %s%z/s",
   "SIZE_B":"B",
   "SIZE_EB":"EB",
   "SIZE_GB":"GB",
   "SIZE_KB":"kB",
   "SIZE_MB":"MB",
   "SIZE_PB":"PB",
   "SIZE_TB":"TB",
   "ST_CAPT_ADVANCED":"Avansert",
   "ST_CAPT_BANDWIDTH":"Bandbreidde",
   "ST_CAPT_CONNECTION":"Samband",
   "ST_CAPT_DISK_CACHE":"Platesnøgglager",
   "ST_CAPT_FOLDER":"Mapper",
   "ST_CAPT_GENERAL":"Generelt",
   "ST_CAPT_SCHEDULER":"Planleggjar",
   "ST_CAPT_QUEUEING":"Køinnstillingar",
   "ST_CAPT_UI_EXTRAS":"UI-ekstra",
   "ST_CAPT_UI_SETTINGS":"UI-innstillingar",
   "ST_CAPT_BITTORRENT":"BitTorrent",
   "ST_CAPT_WEBUI":"Vevgrensesnitt",
   "ST_CAPT_TRANSFER_CAP":"Ovderføringslås",
   "ST_CAPT_RUN_PROGRAM":"Run Program",
   "ST_CBO_UI_DBLCLK_TOR":"Vis eigenskapar||Start/Stopp||Opne mappe||Vis nedlastingsbar||",
   "ST_CBO_ENCRYPTIONS":"Slått av||Slått på||Tvinga||",
   "ST_CBO_PROXY":"(ingen)||Socks4||Socks5||HTTPS||HTTP||",
   "ST_CBO_TCAP_MODES":"Opplastingar||Nedlastingar||Opplastingar + nedlastingar||",
   "ST_CBO_TCAP_UNITS":"MB||GB||",
   "ST_CBO_TCAP_PERIODS":"1||2||5||7||10||14||15||20||21||28||30||31||",
   "ST_COL_NAME":"Namn",
   "ST_COL_VALUE":"Verdi",
   "ST_SCH_DAYCODES":"mån||tys||ons||tor||fre||lau||sun||",
   "ST_SCH_DAYNAMES":"måndag||tysdag||onsdag||torsdag||fredag||laurdag||sundag||",
   "ST_SCH_LGND_FULL":"Full fart",
   "ST_SCH_LGND_FULLEX":"Full fart - Brukar normal global bandbreiddeavgrensing",
   "ST_SCH_LGND_LIMITED":"Avgrensa",
   "ST_SCH_LGND_LIMITEDEX":"Avgrensa - Brukar planleggjar-spesifisert bandbreiddegrense",
   "ST_SCH_LGND_SEEDING":"Berre kjeldedeling",
   "ST_SCH_LGND_SEEDINGEX":"Berre kjeldedeling - Berre opplastdata data (inkl. uferdige)",
   "ST_SCH_LGND_OFF":"Slå av",
   "ST_SCH_LGND_OFFEX":"Slå av - Stoppar alle torrentar som ikkje er tvungne",
   "ST_SEEDTIMES_HOURS":"<= %d timar",
   "ST_SEEDTIMES_IGNORE":"(ignorer)",
   "ST_SEEDTIMES_MINUTES":"<= %d minutt",
   "TIME_DAYS_HOURS":"%dd %dh",
   "TIME_HOURS_MINS":"%dh %dm",
   "TIME_MINS_SECS":"%dm %ds",
   "TIME_SECS":"%ds",
   "TIME_WEEKS_DAYS":"%dw %dd",
   "TIME_YEARS_WEEKS":"%dy %dw",
   "ML_MORE_ACTIONS":null,
   "Torrents":null,
   "Feeds":null,
   "App":null,
   "country":null,
   "ETA":null,
   "of":null,
   "/s":null,
   "Paste a torrent or feed URL":null,
   "Home":null,
   "Logout":null,
   "Seeding":null,
   "All Feeds":null,
   "bitrate":null,
   "resolution":null,
   "length":null,
   "streamable":null,
   "type":null,
   "remote":null,
   "about":null,
   "sessions":null,
   "share":null,
   "Share this torrent":null,
   "Share link":null,
   "add":null,
   "logout":null,
   "log in":null,
   "anywhere access":null,
   "stay signed in":null,
   "download":null,
   "Your client is currently not available. Verify that it is connected to the internet.":null,
   "Unable to communicate with your &micro;Torrent client. This message will disappear automatically when a connection is re-established.":null,
   "Open file":null,
   "Download to your computer":null,
   "Open with VLC Media Player":null,
   "Actions":null,
   "season":null,
   "DLG_ABOUT_VERSION_LEGEND":null,
   "DLG_ABOUT_VERSION_VERSION":null,
   "DLG_ABOUT_VERSION_REVISION":null,
   "DLG_ABOUT_VERSION_BUILD_DATE":null,
   "DLG_ABOUT_VERSION_PEER_ID":null,
   "DLG_ABOUT_VERSION_USER_AGENT":null,
   "DLG_ABOUT_UPNP_EXTERNAL_ADDRESS":null,
   "DLG_ABOUT_UI_REVISION":null,
   "DLG_SETTINGS_SAVE":null,
   "DLG_SETTINGS_MENU_TITLE":null,
   "DLG_SETTINGS_D_REMOTE_01":"BitTorrent fjernstyring",
   "DLG_SETTINGS_D_REMOTE_02":"BitTorrent fjernstyring tilbyr ein lett og trygg tilgangsmåte til klienten din gjennom ein nettlesar.",
   "DLG_SETTINGS_D_REMOTE_03":"Slå på sambandet nedanfor, vel datamaskin-namn og passord. Hugs å la datamaskina stå på.",
   "DLG_SETTINGS_D_REMOTE_04":"Finn ut meir",
   "DLG_SETTINGS_D_REMOTE_05":"Slå på BitTorrent fjernstyringstilgang",
   "DLG_SETTINGS_D_REMOTE_06":"Verifisering",
   "DLG_SETTINGS_D_REMOTE_07":"Brukarnamn:",
   "DLG_SETTINGS_D_REMOTE_08":"Passord:",
   "DLG_SETTINGS_D_REMOTE_09":"Send",
   "ST_CAPT_REMOTE":"BitTorrent fjernstyring"
}