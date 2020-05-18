{
    function ignoreSep ([sep, str]) {
        return str
    }

    function titleCase(str) {
        return str[0].toUpperCase() + str.slice(1).toLowerCase()
    }

    function canonicalizeFields(fields) {
        return fields.map(ignoreSep).filter(f => f !== 'true').sort(compareTuple)
    }

    function compareTuple(t1, t2) {
        return t1[0] < t2[0] ? -1 : t1[0] > t2[0] ? 1 : 0
    }

    function canonicalizeLangId (languages, region, variants) {
        const [lang, script] = languages
      const result = {
          lang,
          script,
          region: '',
          variants: []
      }
      if (lang.length === 4) {
          result.script = titleCase(lang)
      } else {
          result.lang = lang.toLowerCase()
          if (script) {
              result.script = titleCase(script[1])
          }
      }

      if (region) {
          result.region = region[1].toUpperCase()
      }

      if (Array.isArray(variants) && variants.length) {
          result.variants = variants.map(ignoreSep).sort()
      }
      return result
    }
}

// https://unicode.org/reports/tr35/#unicode_locale_id
// This does not contain unicode_subdivision_id, unicode_subdivision_suffix & unicode_measure_unit
unicode_locale_id = lang:unicode_language_id extensions:extensions* puExtension:pu_extensions? {
    let unicodeExtension
    let transformedExtension
    const otherExtensions = {}
    for (const ext of extensions) {
        if (ext.type === 'u') {
            if (unicodeExtension) {
                throw new RangeError('There can only be 1 -u- extension')
            }
            unicodeExtension = ext
        } else if (ext.type === 't') {
            if (transformedExtension) {
                throw new RangeError('There can only be 1 -t- extension')
            }
            transformedExtension = ext
        } else {
            if (otherExtensions[ext.type]) {
                throw new RangeError(`There can only be 1 -${ext.type}- extension`)   
            }
            otherExtensions[ext.type] = ext.value
        }
    }
    return {
        lang,
        otherExtensions,
        unicodeExtension,
        transformedExtension,
        puExtension
    }
};
extensions = unicode_locale_extensions
    / transformed_extensions
    / other_extensions;
unicode_locale_extensions = sep [uU]
    extension:(
        attributes:(sep attribute)+ keywords:(sep keyword)* {
            return {
                attributes: attributes.map(ignoreSep).sort(),
                keywords: Array.isArray(keywords) ? keywords.map(ignoreSep).sort(compareTuple) : []
            }
        }
        / keywords:(sep keyword)+ {
            return { keywords: keywords.map(ignoreSep).sort(compareTuple) }
        }
    ) {
        return {...extension, type: 'u'}
    };
transformed_extensions = sep [tT]
   extension:(
       sep lang:tlang fields:(sep tfield)* { 
           const result = {lang, fields: []}
           if (Array.isArray(fields)) {
               result.fields = canonicalizeFields(fields)
           }
       }
        / fields:(sep tfield)+ {
            return {fields: canonicalizeFields(fields) }
        }
    ) {
        return {...extension, type: 't'}
    };
pu_extensions = sep [xX] extensions:(sep anum_1_8)+ {
    return { type: 'x', values: extensions.map(ignoreSep).join('-') }
};
// alphanum-[tTuUxX] but there's no exclusion in pegjs
other_extensions = sep type:[0-9a-sA-SvwyzVWYZ] values:(sep anum_2_8)+ {
    return { 
        type,
        value: values.map(ignoreSep).join('-') 
    }
};
keyword = key:key value:(sep type)? {
    if (Array.isArray(value) && value[1]) {
        return [key, value[1] === 'true' ? '' : value[1]]
    }
    return [key, '']
};
key = $(anum alpha);

type = $(anum_3_8 (sep anum_3_8)*);	
attribute = anum_3_8;
tlang = lang:unicode_language_subtag
  script:(sep unicode_script_subtag)?
  region:(sep unicode_region_subtag)?
  variants:(sep unicode_variant_subtag)* {
      return canonicalizeLangId([lang, script], region, variants)
  };
tfield = k:tkey v:tvalue {
    return [k, v]
};	
tkey = $(alpha digit);
tvalue = val:(sep anum_3_8)+ {
    return val.map(ignoreSep)
};

unicode_language_id	= "root" { return { lang: 'root' }} 
  / languages:(unicode_language_subtag (sep unicode_script_subtag)? / unicode_script_subtag) region:(sep unicode_region_subtag)? variants:(sep unicode_variant_subtag)* {
      return canonicalizeLangId(languages, region, variants)
  };
unicode_language_subtag	= alpha_5_8 / alpha_2_3

unicode_script_subtag = $(alpha alpha alpha alpha);	
unicode_region_subtag = $((alpha alpha) / (digit digit digit));
unicode_variant_subtag = $( 
      anum_5_8
    / digit anum anum anum);

// The section below are repetitive bc pegjs doesn't support range (e.g alpha{3,8})
alpha_2_3 = $(
    alpha alpha alpha
    / alpha alpha 
)

alpha_5_8 = $(
    alpha alpha alpha alpha alpha alpha alpha alpha 
    / alpha alpha alpha alpha alpha alpha alpha
    / alpha alpha alpha alpha alpha alpha
    / alpha alpha alpha alpha alpha
)

anum_1_8 = 
    $(anum_2_8 / anum)

anum_2_8 = 
    $(anum_3_8 / anum anum)

anum_1_4 = 
    $(anum anum anum anum 
    / anum anum anum
    / anum anum
    / anum)

anum_3_8 = 
    $(anum_5_8
    / anum anum anum anum
    / anum anum anum)
    
anum_5_8 = 
    $(anum anum anum anum anum anum anum anum
    / anum anum anum anum anum anum anum
    / anum anum anum anum anum anum
    / anum anum anum anum anum)

// Basic char defs
sep	= "-";
digit = [0-9];
alpha = [A-Za-z];
anum = [0-9A-Za-z];
