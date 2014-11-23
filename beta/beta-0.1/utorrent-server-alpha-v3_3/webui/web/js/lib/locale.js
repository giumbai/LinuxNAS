(function(_){

var locale_string = jQuery.cookie("locale");
//var supported_locales = 'jp zhTW ge fyNL vi pt fi et cs lv en ru nnNO de va ko el it hu ar es bg dk ptBR th zhCN sk ca nl ua . is lt sq sl sv tw pl be tu ga he no fr gl ro srSR bs'.split(' ');

var supported_locales = '_ ar eu be bg bs ca cs da de el en es et fi fr fyNL ga gl he hu is it ja ka ko lt lv nl nnNO no pl pt ptBR ro ru sk sl sq srSR sv th tr tw uk va vi zhCN zhTW'.split(' ');

if (! _.contains(supported_locales, locale_string)) {
    locale_string = 'en';
}


if (config.webui) {
    var url = config.static_prefix + "/js/lang/" + (locale_string || "en") + ".js";
} else if (config.ipad_ui) {
    var url = "/js/lang/" + (locale_string || "en") + ".js";
} else {
    var url = config.static_prefix + "/js/lang/" + (locale_string || "en") + ".js";
}

jQuery.ajax({
    url: url,
    dataType: 'script',
    cache: true,
    async: false
});

var lang_extra = {
    'de': 'de_DE',
    'es': 'es_ES',
    'fr': 'fr_FR',
    'it': 'it_IT',
    'ja': 'ja_JP',
    'ko': 'ko_KR',
    'nl': 'nl_NL',
    'pl': 'pl_PL',
    'ptBR': 'pt_BR',
    'ru': 'ru_RU',
    'tr': 'tr_TR',
    'zhCN': 'zh_CN'
}; // extra localization strings


function locale(identifier) {
    if (LANG_STR[identifier]) {
	    return LANG_STR[identifier];
    } else {
        if(window.LANG_STR_fallback && LANG_STR_fallback[identifier])
            return LANG_STR_fallback[identifier];
	    else
	        return identifier;
    }
}

window.locale = locale;

})(exports._)
